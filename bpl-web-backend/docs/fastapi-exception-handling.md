# FastAPI Exception Handling Best Practices

## ปัญหาที่พบและการแก้ไข

### ปัญหา: HTTPException ถูกจับและแปลงเป็น 500 Error

ในการพัฒนา FastAPI API เรามักจะใช้ `HTTPException` เพื่อส่งข้อผิดพลาดกลับไปยัง client พร้อมกับ status code ที่เหมาะสม เช่น 404 Not Found หรือ 422 Unprocessable Entity แต่หากเรามีการจัดการ exception ที่ไม่ถูกต้อง อาจทำให้ `HTTPException` ถูกจับและแปลงเป็น 500 Internal Server Error แทน

**ตัวอย่างโค้ดที่มีปัญหา:**

```python
@router.put("/profiles/me", response_model=UserProfileResponse)
def update_user_profile(profile_update: UpdateUserProfile, current_user: User = Depends(get_current_user)):
    try:
        update_data = profile_update.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=422, detail="No fields to update")

        response = supabase.table('user_profiles').update(update_data).eq('user_id', current_user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found to update")
            
        return response.data[0]
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
```

ในโค้ดข้างต้น `HTTPException` ที่เกิดขึ้นภายใน try block จะถูกจับโดย `except Exception as e:` และถูกแปลงเป็น 500 error แทนที่จะเป็น 404 หรือ 422 ตามที่เราตั้งใจไว้

### การแก้ไข: Re-raise HTTPException โดยตรง

เพื่อแก้ไขปัญหานี้ เราต้องเพิ่ม exception handler เฉพาะสำหรับ `HTTPException` เพื่อให้มันถูก re-raise โดยตรง:

```python
@router.put("/profiles/me", response_model=UserProfileResponse)
def update_user_profile(profile_update: UpdateUserProfile, current_user: User = Depends(get_current_user)):
    try:
        update_data = profile_update.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=422, detail="No fields to update")

        response = supabase.table('user_profiles').update(update_data).eq('user_id', current_user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found to update")
            
        return response.data[0]
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
    except HTTPException:
        # Re-raise HTTPException directly to preserve status code
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
```

การเพิ่ม `except HTTPException: raise` ทำให้ `HTTPException` ที่เกิดขึ้นภายในฟังก์ชันถูกส่งกลับไปยัง client โดยตรงโดยไม่ถูกแปลงเป็น 500 error

## การทดสอบ FastAPI API

### การทดสอบกรณีข้อผิดพลาด

การทดสอบกรณีข้อผิดพลาดใน FastAPI API มีความสำคัญมาก เพื่อให้แน่ใจว่า API ของเราส่งข้อผิดพลาดกลับไปยัง client อย่างถูกต้อง

**ตัวอย่างการทดสอบกรณี 404 Not Found:**

```python
@patch('bpl_web_backend.routes.profiles.supabase')
def test_update_profile_not_found(mock_supabase, client: TestClient, mock_user):
    """Tests that updating a non-existent profile fails with 404 Not Found."""
    # Mock the response with empty data array
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    
    # Send the request
    profile_payload = UpdateUserProfile(nickname="Ghost")
    response = client.put("/api/profiles/me", json=profile_payload.model_dump(exclude_unset=True))
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Profile not found to update"}
```

**ตัวอย่างการทดสอบกรณี 422 Unprocessable Entity:**

```python
@patch('bpl_web_backend.routes.profiles.supabase')
def test_update_profile_empty_payload(mock_supabase, client: TestClient, mock_user):
    """Tests that sending an empty payload for profile update fails with 422 Unprocessable Entity."""
    # Send empty payload to trigger validation error
    response = client.put("/api/profiles/me", json={})
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {"detail": "No fields to update"}
```

## บทเรียนที่ได้รับ

1. **การจัดการ Exception ที่ถูกต้อง**:
   - ควรระมัดระวังเมื่อใช้ `except Exception` เพราะมันจะจับ exception ทุกประเภท รวมถึง HTTPException ด้วย
   - ควรจัดการ HTTPException แยกต่างหากเพื่อให้มันถูกส่งกลับไปยัง client โดยตรง
   - ลำดับของ exception handlers มีความสำคัญ ควรจัดการ exception ที่เฉพาะเจาะจงก่อน exception ที่กว้างกว่า

2. **การทดสอบ API**:
   - การ mock ที่ถูกต้องมีความสำคัญมาก โดยเฉพาะเมื่อทดสอบกรณีข้อผิดพลาด
   - การตรวจสอบ status code และ response body เป็นส่วนสำคัญของการทดสอบ API
   - ควรทดสอบทั้งกรณีปกติและกรณีข้อผิดพลาดเพื่อให้แน่ใจว่า API ของเราทำงานได้อย่างถูกต้องในทุกสถานการณ์

3. **การแก้ไขปัญหาที่ต้นเหตุ**:
   - การแก้ไขที่ต้นเหตุในโค้ด router เป็นวิธีที่ดีที่สุด
   - การแก้ไขที่ต้นเหตุทำให้เราไม่ต้องใช้วิธีการ workaround ที่ซับซ้อนในเทสต์

## แนวทางปฏิบัติที่ดีในการจัดการ Exception ใน FastAPI

1. **จัดการ Exception ที่เฉพาะเจาะจงก่อน**:
   ```python
   try:
       # โค้ดที่อาจเกิด exception
   except SpecificException:
       # จัดการ specific exception
   except Exception:
       # จัดการ general exception
   ```

2. **ไม่ควรจับ HTTPException ด้วย Exception handler ทั่วไป**:
   ```python
   try:
       # โค้ดที่อาจเกิด HTTPException
   except HTTPException:
       # Re-raise HTTPException directly
       raise
   except Exception as e:
       # จัดการ general exception
       raise HTTPException(status_code=500, detail=str(e))
   ```

3. **ใช้ FastAPI exception handlers สำหรับการจัดการ exception ระดับแอปพลิเคชัน**:
   ```python
   @app.exception_handler(CustomException)
   async def custom_exception_handler(request, exc):
       return JSONResponse(
           status_code=418,
           content={"message": f"Oops! {exc.name} did something. There goes a rainbow..."},
       )
   ```

4. **ใช้ Pydantic validation สำหรับการตรวจสอบข้อมูลนำเข้า**:
   ```python
   class Item(BaseModel):
       name: str
       price: float
       is_offer: bool = None
   ```

5. **ใช้ response_model เพื่อตรวจสอบข้อมูลส่งออก**:
   ```python
   @app.get("/items/{item_id}", response_model=Item)
   def read_item(item_id: int):
       return get_item_from_database(item_id)
   ```

6. **ใช้ dependencies สำหรับการตรวจสอบและการจัดการข้อผิดพลาดที่เกิดซ้ำ**:
   ```python
   def verify_token(x_token: str = Header(...)):
       if x_token != "fake-super-secret-token":
           raise HTTPException(status_code=400, detail="X-Token header invalid")
       return x_token

   @app.get("/items/", dependencies=[Depends(verify_token)])
   def read_items():
       return [{"item": "Foo"}, {"item": "Bar"}]
   ```

7. **ใช้ status code ที่ถูกต้องและมีความหมาย**:
   - 200: OK - การร้องขอสำเร็จ
   - 201: Created - สร้างทรัพยากรใหม่สำเร็จ
   - 204: No Content - การร้องขอสำเร็จแต่ไม่มีเนื้อหาส่งกลับ
   - 400: Bad Request - การร้องขอไม่ถูกต้อง
   - 401: Unauthorized - ไม่ได้รับอนุญาตให้เข้าถึง
   - 403: Forbidden - ไม่มีสิทธิ์เข้าถึง
   - 404: Not Found - ไม่พบทรัพยากร
   - 422: Unprocessable Entity - ข้อมูลไม่ถูกต้องหรือไม่สมบูรณ์
   - 500: Internal Server Error - ข้อผิดพลาดภายในเซิร์ฟเวอร์