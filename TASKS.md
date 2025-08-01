# BPL-Web Project: Task Checklist

นี่คือรายการ Task ทั้งหมดที่ต้องทำสำหรับโปรเจกต์ Blood Pressure Logging Web Application โดยแบ่งตาม Phase การพัฒนา

---

### **Phase 1: การตั้งค่าโปรเจกต์และฐานข้อมูล (Project & Database Setup)**

- [x] **1. ตั้งค่าโปรเจกต์บน Supabase:**
    - [x] สร้างโปรเจกต์ใหม่ใน Supabase
    - [x] เตรียม `URL` และ `anon key` สำหรับใช้ในฝั่ง Frontend
    - [ ] เตรียม `service_role key` สำหรับใช้ในฝั่ง Backend

- [x] **2. ออกแบบและสร้างตารางข้อมูล (Database Schema):**
    - [x] **ตาราง `user_profiles`:**
        - `user_id` (UUID, FK to `auth.users.id`, PK)
        - `full_name` (Text)
        - `nickname` (Text, Nullable)
        - `date_of_birth` (Date)
        - `medical_conditions` (Text, Nullable)
        - `gender` (Text, Nullable)
        - `created_at` (Timestamptz)
        - `updated_at` (Timestamptz)
    - [x] **ตาราง `medications`:**
        - `medication_id` (UUID, PK)
        - `user_id` (UUID, FK to `auth.users.id`)
        - `medicine_name` (Text)
        - `dosage_mg` (Integer)
        - `quantity` (Text)
        - `intake_time` (Array of Text, `text[]`)
        - `is_active` (Boolean, Default `true`)
        - `notes` (Text, Nullable)
        - `created_at` (Timestamptz)
        - `updated_at` (Timestamptz)
    - [x] **ตาราง `blood_pressure_records`:**
        - `record_id` (UUID, PK)
        - `user_id` (UUID, FK to `auth.users.id`)
        - `record_datetime` (Timestamptz)
        - `systolic` (Integer)
        - `diastolic` (Integer)
        - `heart_rate` (Integer)
        - `notes` (Text, Nullable)
        - `created_at` (Timestamptz)

- [x] **3. ตั้งค่าโปรเจกต์ Frontend และ Backend:**
    - [x] สร้าง Repository สำหรับโปรเจกต์ Next.js
    - [x] สร้าง Repository สำหรับโปรเจกต์ FastAPI

---

### **Phase 2: การพัฒนา Backend (FastAPI)**

- [x] **1. Authentication & Middleware:**
    - [x] ติดตั้ง Dependencies ที่จำเป็น (FastAPI, Uvicorn, Supabase-py)
    - [x] สร้าง Middleware สำหรับตรวจสอบ JWT Token ที่ได้รับจาก Supabase เพื่อยืนยันตัวตน

- [x] **2. API Endpoints สำหรับ User Profile:**
    - [x] `GET /api/profiles/me`: ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ Login อยู่
    - [x] `POST /api/profiles`: สร้างโปรไฟล์ใหม่
    - [x] `PUT /api/profiles/me`: แก้ไข/อัปเดตข้อมูลโปรไฟล์

- [x] **3. API Endpoints สำหรับ Medication Log:**
    - [x] `GET /api/medications`: ดึงรายการยาทั้งหมดของผู้ใช้
    - [x] `POST /api/medications`: เพิ่มยาใหม่
    - [x] `PUT /api/medications/{medication_id}`: แก้ไขข้อมูลยา
    - [x] `DELETE /api/medications/{medication_id}`: ลบรายการยา

- [x] **4. API Endpoints สำหรับ Blood Pressure Log:**
    - [x] `GET /api/blood-pressure-logs`: ดึงรายการบันทึกความดันทั้งหมด (รองรับ Pagination)
    - [x] `POST /api/blood-pressure-logs`: เพิ่มรายการบันทึกความดันใหม่

- [x] **5. API Endpoint สำหรับ Export Data:**
    - [x] `GET /api/blood-pressure-logs/export`: Export ข้อมูลความดันทั้งหมดเป็นไฟล์ Excel (`.xlsx`)

---

### **Phase 3: การพัฒนา Frontend (Next.js)**

- [x] **1. ตั้งค่าพื้นฐานและ Authentication:**
    - [x] ติดตั้ง Dependencies (Supabase-js, UI Library)
    - [x] เชื่อมต่อกับโปรเจกต์ Supabase
    - [x] สร้างหน้า **Register** (`/register`)
    - [x] สร้างหน้า **Login** (`/login`)
    - [x] จัดการ State การ Login และสร้าง Protected Routes

- [ ] **2. หน้า User Profile:**
    - [x] สร้างหน้า **Profile** (`/profile`)
    - [x] สร้างฟอร์มสำหรับกรอกและแก้ไขข้อมูลโปรไฟล์
    - [x] **UI:** ใช้วิดเจ็ต **Calendar Picker** สำหรับ `date_of_birth` และ **Dropdown** สำหรับ `gender`

- [ ] **3. หน้า Medication Log:**
    - [x] สร้างหน้า **Medications** (`/medications`)
    - [x] แสดงผลรายการยาของผู้ใช้
    - [x] สร้างฟอร์ม (Modal) สำหรับเพิ่มและแก้ไขยา
    - [x] **UI:** ใช้วิดเจ็ต **Multiple Selection** สำหรับ `intake_time`

- [ ] **4. หน้า Homepage (Dashboard):**
    - [x] สร้างหน้าหลัก (`/`)
    - [x] สร้างฟอร์มสำหรับ **บันทึกค่าความดันโลหิต**
        - [x] **UI:** ใช้ **Calendar Picker** และ **Time Picker**
    - [x] แสดงตาราง/การ์ดข้อมูลความดัน **25 รายการล่าสุด**
    - [x] สร้างปุ่ม **"Export to Excel"**

- [ ] **5. การออกแบบและ UX:**
    - [ ] ทำให้ทุกหน้าเป็น Responsive Design
    - [ ] ออกแบบ UI/UX ให้ใช้งานง่าย
