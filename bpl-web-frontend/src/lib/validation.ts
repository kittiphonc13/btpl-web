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
    .min(50, 'Systolic too low (minimum 50)')
    .max(300, 'Systolic too high (maximum 300)'),
  diastolic: z
    .number()
    .int('Must be a whole number')
    .min(30, 'Diastolic too low (minimum 30)')
    .max(200, 'Diastolic too high (maximum 200)'),
  heartRate: z
    .number()
    .int('Must be a whole number')
    .min(30, 'Heart rate too low (minimum 30)')
    .max(220, 'Heart rate too high (maximum 220)'),
  notes: z
    .string()
    .max(500, 'Notes too long (maximum 500 characters)')
    .transform(notes => DOMPurify.sanitize(notes.trim()))
    .optional(),
  recordDateTime: z
    .string()
    .datetime('Invalid date format')
    .refine(date => {
      const recordDate = new Date(date);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return recordDate >= oneYearAgo && recordDate <= oneWeekFromNow;
    }, 'Date must be within the last year and not more than a week in the future'),
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

// Input sanitization utilities
export const sanitizeInput = {
  text: (input: string): string => {
    return DOMPurify.sanitize(input.trim(), { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
  },
  
  richText: (input: string): string => {
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  },
  
  number: (input: string | number): number => {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Invalid number');
    }
    return num;
  },
  
  email: (input: string): string => {
    const sanitized = DOMPurify.sanitize(input.toLowerCase().trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
    
    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }
};

// Type definitions for validated data
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type BloodPressureFormData = z.infer<typeof bloodPressureSchema>;

// Validation result type
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err: z.ZodIssue) => err.message),
      };
    }
    
    return {
      success: false,
      errors: ['Validation failed'],
    };
  }
}
