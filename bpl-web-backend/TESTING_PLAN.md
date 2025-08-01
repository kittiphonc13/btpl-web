# แผนการทดสอบสำหรับ BPL-WEB Backend (FastAPI)

เอกสารนี้สรุปแผนการทดสอบสำหรับโปรเจกต์ `bpl-web-backend` โดยใช้ `pytest` เป็นเครื่องมือหลักในการทดสอบ

---

### 1. การติดตั้งเครื่องมือที่จำเป็น (Setup & Tooling)

ก่อนเริ่มเขียนเทส ให้ติดตั้ง Library ที่จำเป็นก่อน:

```bash
pip install pytest httpx pytest-cov
```

- **pytest:** Test runner มาตรฐานสำหรับ Python
- **httpx:** HTTP client สำหรับการส่ง request ไปยัง API ในโหมด async (จำเป็นสำหรับ FastAPI)
- **pytest-cov:** Plugin สำหรับวัดผล Test Coverage

สร้างไฟล์ `conftest.py` ที่ root ของโฟลเดอร์เทส (`tests/`) เพื่อตั้งค่า Test Client สำหรับ FastAPI:

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from main import app # สมมติว่า main.py คือที่เก็บ FastAPI app ของคุณ

@pytest.fixture(scope="module")
def test_client():
    client = TestClient(app)
    yield client

@pytest.fixture(scope="module")
async def async_test_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

---

### 2. Unit Tests (การทดสอบรายหน่วย)

#### 2.1. ทดสอบ Models (Pydantic)

**เป้าหมาย:** ตรวจสอบว่า Model `UserProfile` ใน `models.py` สามารถรับข้อมูลที่ถูกต้องและปฏิเสธข้อมูลที่ผิดพลาดได้

**ไฟล์ที่จะสร้าง:** `tests/unit/test_models.py`

- **Test Case 1:** ทดสอบสร้าง `UserProfile` ด้วยข้อมูลที่ถูกต้องทั้งหมด
- **Test Case 2:** ทดสอบสร้าง `UserProfile` โดยขาด field ที่จำเป็น (เช่น `first_name`) ควรจะเกิด `ValidationError`
- **Test Case 3:** ทดสอบสร้าง `UserProfile` ด้วยข้อมูลผิดประเภท (เช่น `line_id` เป็น integer) ควรจะเกิด `ValidationError`

---

### 3. Integration Tests (การทดสอบแบบบูรณาการ)

**เป้าหมาย:** ทดสอบ Endpoint `/profiles/test-create` เพื่อให้มั่นใจว่าสามารถสร้างและอัปเดตโปรไฟล์ได้อย่างถูกต้อง

**ข้อควรระวัง:** การทดสอบ Integration Test ควรแยกฐานข้อมูลสำหรับทดสอบออกจากฐานข้อมูลจริง หรือใช้การ Mocking เพื่อจำลองการตอบสนองจาก Supabase เพื่อไม่ให้ข้อมูลทดสอบปะปนกับข้อมูลจริง

**ไฟล์ที่จะสร้าง:** `tests/integration/test_profiles_api.py`

#### Endpoint: `POST /profiles/test-create`

- **Test Case 1: สร้างโปรไฟล์สำเร็จ (Happy Path - Create)**
    - **ขั้นตอน:**
        1. Mock Supabase client ให้คืนค่าว่า *ไม่พบ* โปรไฟล์เดิม
        2. Mock Supabase client ให้คืนค่าว่า *สร้าง* โปรไฟล์ใหม่สำเร็จ
        3. ส่ง Request `POST` ไปยัง `/profiles/test-create` พร้อมข้อมูลที่ถูกต้อง
    - **ผลที่คาดหวัง:**
        - ได้รับ HTTP Status Code `200 OK`
        - Response body ตรงกับข้อมูลที่ส่งไปและมี `user_id` ที่ถูกต้อง

- **Test Case 2: อัปเดตโปรไฟล์สำเร็จ (Happy Path - Update)**
    - **ขั้นตอน:**
        1. Mock Supabase client ให้คืนค่าว่า *พบ* โปรไฟล์เดิม
        2. Mock Supabase client ให้คืนค่าว่า *อัปเดต* โปรไฟล์สำเร็จ
        3. ส่ง Request `POST` ไปยัง `/profiles/test-create` พร้อมข้อมูลใหม่
    - **ผลที่คาดหวัง:**
        - ได้รับ HTTP Status Code `200 OK`
        - Response body เป็นข้อมูลที่อัปเดตแล้ว

- **Test Case 3: ข้อมูลนำเข้าไม่ถูกต้อง (Invalid Input)**
    - **ขั้นตอน:**
        1. ส่ง Request `POST` ไปยัง `/profiles/test-create` โดยไม่มี `first_name`
    - **ผลที่คาดหวัง:**
        - ได้รับ HTTP Status Code `422 Unprocessable Entity`
        - Response body มีรายละเอียดของ Error จาก Pydantic

- **Test Case 4: Database Error**
    - **ขั้นตอน:**
        1. Mock Supabase client ให้จำลองว่าการเขียนลงฐานข้อมูลล้มเหลว (เช่น `execute()` คืนค่า data เป็น `None`)
    - **ผลที่คาดหวัง:**
        - ได้รับ HTTP Status Code `500 Internal Server Error`
        - Response body มี detail message ว่า "Failed to create test profile"

---

### 4. Security Tests (OWASP Top 10 Focus)

**เป้าหมาย:** ตรวจสอบช่องโหว่พื้นฐานที่อาจเกิดขึ้น

**ไฟล์ที่จะสร้าง:** `tests/security/test_security.py`

- **Test Case 1: (A03: Injection)**
    - **ขั้นตอน:** ส่ง Payload ที่มีลักษณะของ SQL Injection หรือ Cross-Site Scripting (XSS) ใน field ต่างๆ เช่น `first_name` เป็น `"<script>alert(1)</script>"`
    - **ผลที่คาดหวัง:**
        - Request ควรจะผ่านการ Validation ของ Pydantic ตามปกติ (เพราะ Pydantic จะมองเป็นแค่ String) และเมื่อบันทึกลง DB ก็ควรจะถูกบันทึกเป็น String ธรรมดา ไม่ใช่โค้ดที่ถูก Execute
        - เป็นการยืนยันว่า Data Validation Layer ทำงานได้ดี

- **Test Case 2: (A01: Broken Access Control)**
    - **หมายเหตุ:** Endpoint `/profiles/test-create` ปัจจุบันไม่มีการป้องกัน แต่ในอนาคตเมื่อมี Endpoint จริงที่ต้องมีการยืนยันตัวตน (Authentication) เราต้องเพิ่มเทสนี้
    - **ขั้นตอน (สำหรับอนาคต):**
        1. พยายามเข้าถึง Endpoint ที่ต้องใช้ Token โดยไม่ส่ง Token ไปด้วย
        2. พยายามเข้าถึง Endpoint ด้วย Token ที่ไม่ถูกต้อง หรือหมดอายุ
    - **ผลที่คาดหวัง (สำหรับอนาคต):**
        - ได้รับ HTTP Status Code `401 Unauthorized` หรือ `403 Forbidden`

---

### 5. การรันเทสและดูผลลัพธ์

รันเทสทั้งหมดด้วยคำสั่ง:

```bash
pytest -v
```

รันเทสพร้อมดู Test Coverage:

```bash
pytest --cov=.
```

คำสั่งนี้จะแสดงผลว่าโค้ดของคุณถูกทดสอบไปกี่เปอร์เซ็นต์ ซึ่งจะช่วยให้เห็นว่าส่วนไหนของโค้ดที่ยังขาดการทดสอบ
