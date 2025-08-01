# BPL Web Frontend - Setup Guide 🚀

## Environment Variables Setup

### Required Environment Variables

สร้างไฟล์ `.env.local` ใน root directory และเพิ่ม environment variables ดังนี้:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### การหา Supabase Credentials

1. ไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. เลือกโปรเจกต์ของคุณ
3. ไปที่ Settings > API
4. คัดลอก:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys > anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### ตัวอย่างไฟล์ .env.local

```bash
# ตัวอย่าง (ใช้ค่าจริงของคุณ)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Database Schema Required

แอปพลิเคชันต้องการตาราง `blood_pressure_records` ใน Supabase database:

```sql
-- Create blood_pressure_records table
CREATE TABLE blood_pressure_records (
    record_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    record_datetime TIMESTAMPTZ NOT NULL,
    systolic INTEGER NOT NULL,
    diastolic INTEGER NOT NULL,
    heart_rate INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE blood_pressure_records ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own records
CREATE POLICY "Users can view own records" ON blood_pressure_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" ON blood_pressure_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON blood_pressure_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON blood_pressure_records
    FOR DELETE USING (auth.uid() = user_id);
```

## Troubleshooting

### ปัญหาที่พบบ่อย:

1. **Application error: a client-side exception has occurred**
   - ตรวจสอบว่าไฟล์ `.env.local` มีค่าที่ถูกต้อง
   - ตรวจสอบ Supabase URL และ API Key

2. **Authentication ไม่ทำงาน**
   - ตรวจสอบ Supabase project settings
   - ตรวจสอบ RLS policies

3. **Database connection error**
   - ตรวจสอบว่าสร้างตาราง `blood_pressure_records` แล้ว
   - ตรวจสอบ RLS policies

## Next Steps

หลังจากตั้งค่าเรียบร้อยแล้ว:

1. รันแอปพลิเคชัน: `npm run dev`
2. เปิด http://localhost:3000
3. ทดสอบการสมัครสมาชิกและเข้าสู่ระบบ
4. ทดสอบการเพิ่มข้อมูลความดันโลหิต

---

**หมายเหตุ:** ไฟล์ `.env.local` จะถูก ignore โดย git เพื่อความปลอดภัย อย่าเผยแพร่ API keys ในที่สาธารณะ
