# BPL Web Frontend - Security Fixes Plan 🔒

## Overview
แผนการแก้ไขช่องโหว่ด้านความปลอดภัยที่พบจากการทดสอบ Phase 1

---

## 🔴 High Priority Security Vulnerabilities

### 1. Rate Limiting (Critical - OWASP A07)
**ปัญหา:** ไม่มีการจำกัดการ login ที่ล้มเหลว อาจถูก brute-force attack ได้

#### 🛠️ แนวทางแก้ไข:

##### Option A: Client-side Rate Limiting (Basic)
```typescript
// hooks/useRateLimit.ts
import { useState, useRef } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export function useRateLimit(config: RateLimitConfig) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(config.maxAttempts);
  const attemptsRef = useRef<number[]>([]);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    
    // Remove old attempts outside the window
    attemptsRef.current = attemptsRef.current.filter(
      time => now - time < config.windowMs
    );

    if (attemptsRef.current.length >= config.maxAttempts) {
      setIsBlocked(true);
      setAttemptsLeft(0);
      
      // Auto-unblock after block duration
      setTimeout(() => {
        setIsBlocked(false);
        setAttemptsLeft(config.maxAttempts);
        attemptsRef.current = [];
      }, config.blockDurationMs);
      
      return false;
    }

    return true;
  };

  const recordAttempt = () => {
    attemptsRef.current.push(Date.now());
    setAttemptsLeft(config.maxAttempts - attemptsRef.current.length);
  };

  return { isBlocked, attemptsLeft, checkRateLimit, recordAttempt };
}
```

##### Option B: Server-side Rate Limiting (Recommended)
```typescript
// middleware.ts (Next.js 13+)
import { NextRequest, NextResponse } from 'next/server';
import { ratelimit } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*'],
};
```

**Implementation Priority:** HIGH  
**Estimated Time:** 2-4 hours  
**Dependencies:** @upstash/ratelimit, @upstash/redis (for server-side)

---

### 2. CSRF Protection (High - OWASP A01)
**ปัญหา:** ไม่มี CSRF token ป้องกันการโจมตี Cross-Site Request Forgery

#### 🛠️ แนวทางแก้ไข:

##### Option A: SameSite Cookies (Basic)
```typescript
// lib/csrf.ts
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

export function setCSRFCookie(token: string) {
  cookies().set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export function validateCSRFToken(token: string): boolean {
  const cookieToken = cookies().get('csrf-token')?.value;
  return cookieToken === token;
}
```

##### Option B: Double Submit Cookie Pattern
```typescript
// components/CSRFProtectedForm.tsx
'use client';

import { useEffect, useState } from 'react';

interface CSRFProtectedFormProps {
  children: React.ReactNode;
  onSubmit: (formData: FormData, csrfToken: string) => Promise<void>;
}

export function CSRFProtectedForm({ children, onSubmit }: CSRFProtectedFormProps) {
  const [csrfToken, setCSRFToken] = useState<string>('');

  useEffect(() => {
    // Get CSRF token from server
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCSRFToken(data.token));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData, csrfToken);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="csrf-token" value={csrfToken} />
      {children}
    </form>
  );
}
```

**Implementation Priority:** HIGH  
**Estimated Time:** 3-5 hours  
**Dependencies:** Built-in Next.js features

---

### 3. Input Sanitization (High - OWASP A03)
**ปัญหา:** ไม่มีการ sanitize input ก่อนส่งไป Supabase

#### 🛠️ แนวทางแก้ไข:

##### Zod Validation Schema
```typescript
// lib/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(254, 'Email too long')
  .transform(email => email.toLowerCase().trim());

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase, uppercase, and number');

// Blood pressure validation
export const bloodPressureSchema = z.object({
  systolic: z
    .number()
    .int('Must be a whole number')
    .min(50, 'Systolic too low')
    .max(300, 'Systolic too high'),
  diastolic: z
    .number()
    .int('Must be a whole number')
    .min(30, 'Diastolic too low')
    .max(200, 'Diastolic too high'),
  heartRate: z
    .number()
    .int('Must be a whole number')
    .min(30, 'Heart rate too low')
    .max(220, 'Heart rate too high'),
  notes: z
    .string()
    .max(500, 'Notes too long')
    .transform(notes => DOMPurify.sanitize(notes.trim()))
    .optional(),
});

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Registration form validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

##### React Hook Form Integration
```typescript
// hooks/useValidatedForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export function useValidatedForm<T extends z.ZodType>(schema: T) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });
}
```

**Implementation Priority:** HIGH  
**Estimated Time:** 4-6 hours  
**Dependencies:** zod, react-hook-form, @hookform/resolvers, isomorphic-dompurify

---

### 4. Security Headers ⚠️ **HIGH PRIORITY**

**Status:** ✅ **COMPLETED**ไม่มี security headers ป้องกันการโจมตีต่างๆ

#### 🛠️ แนวทางแก้ไข:

##### Next.js Security Headers
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Implementation Priority:** MEDIUM  
**Estimated Time:** 1-2 hours  
**Dependencies:** Built-in Next.js features

---

### 1. Rate Limiting ⚠️ **HIGH PRIORITY**

**Status:** ✅ **COMPLETED**ไม่มี rate limiting ป้องกันการโจมตี Brute Force

#### 🛠️ แนวทางแก้ไข:

##### Client-side Rate Limiting
```typescript
// lib/rateLimiter.ts
import { useState, useEffect } from 'react';

const MAX_ATTEMPTS = 5;
const DELAY = 2000; // 2 seconds

export function useRateLimiter() {
  const [attempts, setAttempts] = useState(0);
  const [delay, setDelay] = useState(DELAY);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAttempts(0);
      setDelay(DELAY);
      setLocked(false);
    }, 60000); // 1 minute

    return () => clearTimeout(timeoutId);
  }, []);

  const handleAttempt = () => {
    if (locked) return;

    setAttempts(attempts + 1);

    if (attempts >= MAX_ATTEMPTS) {
      setLocked(true);
    } else {
      setDelay(delay * 2);
    }
  };

  return { attempts, delay, locked, handleAttempt };
}
```

**Implementation Priority:** HIGH  
**Estimated Time:** 2-3 hours  
**Dependencies:** Built-in features

---

### Implementation Status:
- [x] Choose implementation approach (client-side vs server-side)
- [x] Implement rate limiting logic
- [x] Add user feedback for rate limiting
- [x] Test rate limiting functionality

### ✅ **COMPLETED IMPLEMENTATION:**
ติดตั้ง **Client-side Rate Limiting** เรียบร้อยแล้ว:

**📁 ไฟล์ที่สร้าง/แก้ไข:**
- `src/lib/rateLimiter.ts` - Rate limiting library
- `src/app/login/page.tsx` - เพิ่ม rate limiting ในหน้า login
- `src/app/register/page.tsx` - เพิ่ม rate limiting ในหน้า register

**🛡️ คุณสมบัติที่ได้:**
- **Max Attempts**: 5 ครั้งต่อ session
- **Progressive Delays**: เริ่มต้น 2 วินาที, เพิ่มขึ้นแบบ exponential backoff
- **Lockout Duration**: 15 นาทีหลังจากพยายาม 5 ครั้ง
- **Separate Tracking**: แยกการนับสำหรับ Login และ Register
- **User-friendly Messages**: ข้อความแจ้งเตือนเป็นภาษาไทย
- **Auto Reset**: หลังจาก login สำเร็จหรือ 1 ชั่วโมงไม่มีการพยายาม

**🔍 การทำงาน:**
1. ตรวจสอบ rate limit ก่อนส่ง request
2. บันทึกความล้มเหลวและเพิ่ม delay
3. ล็อกบัญชีชั่วคราวหลังจากเกินขีดจำกัด
4. แสดงข้อความแจ้งเตือนที่เข้าใจง่าย
5. ล้างข้อมูลหลังจาก login สำเร็จ

---

## 📋 Implementation Roadmap

### Phase 1: Critical Security (Week 1)
1. **Day 1-2:** Implement Input Sanitization with Zod
2. **Day 3-4:** Add Rate Limiting (client-side first)
3. **Day 5:** Add Security Headers

### Phase 2: Advanced Security (Week 2)
1. **Day 1-2:** Implement CSRF Protection
2. **Day 3:** Improve Error Handling
3. **Day 4-5:** Testing and Refinement

### Phase 3: Monitoring & Logging (Week 3)
1. **Day 1-2:** Add Security Logging
2. **Day 3-4:** Implement Monitoring
3. **Day 5:** Documentation and Training

---

## 🧪 Testing Strategy

### Security Testing Checklist:
- [ ] Rate limiting effectiveness
- [ ] CSRF token validation
- [ ] Input sanitization bypass attempts
- [ ] Error message information leakage
- [ ] Security headers verification

### Tools for Testing:
- **OWASP ZAP** - Automated security scanning
- **Burp Suite** - Manual penetration testing
- **npm audit** - Dependency vulnerability scanning
- **Lighthouse** - Security best practices audit

---

## 📊 Success Metrics

### Before Implementation:
- ❌ 5 High Priority vulnerabilities
- ❌ No rate limiting
- ❌ No CSRF protection
- ❌ Basic error handling

### After Implementation:
- ✅ 0 High Priority vulnerabilities
- ✅ Rate limiting active
- ✅ CSRF protection enabled
- ✅ Secure error handling
- ✅ Security headers configured

---

**Created:** 2025-08-01  
**Priority:** HIGH  
**Estimated Total Time:** 15-20 hours  
**Status:** Planning Phase
