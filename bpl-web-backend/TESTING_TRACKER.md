# BPL-WEB Backend Testing Tracker

This tracker outlines the testing strategy and progress for the FastAPI backend.

---

### Integration Tests (`tests/integration`)

#### Profiles API (`test_main.py`)
- **`GET /api/profiles/me`**
  - [x] Success (200 OK)
  - [x] Profile Not Found (404 Not Found)
  - [x] Unauthorized (No Token) (403 Forbidden)
  - [x] Unauthorized (Invalid Token) (401 Unauthorized)
- **`POST /api/profiles`**
  - [x] Success (201 Created)
  - [x] Profile Already Exists (400 Bad Request)
  - [x] Validation Error (422 Unprocessable Entity)
- **`PUT /api/profiles/me`**
  - [x] Success (200 OK)
  - [x] Profile Not Found (404 Not Found)
  - [x] Validation Error (422 Unprocessable Entity)

#### Medications API (`test_medications_api.py`)
- **`GET /api/medications`**
  - [x] Success - With Results (200 OK)
  - [x] Success - Empty List (200 OK)
- **`POST /api/medications`**
  - [x] Success (201 Created)
  - [x] Validation Error (422 Unprocessable Entity)
- **`PUT /api/medications/{medication_id}`**
  - [x] Success (200 OK)
  - [x] Medication Not Found (404 Not Found)
  - [x] Update another user's medication (404 Not Found)
  - [x] Validation Error (422 Unprocessable Entity)
  - [x] Empty Payload (400 Bad Request)
- **`DELETE /api/medications/{medication_id}`**
  - [x] Success (200 OK)
  - [x] Medication Not Found (404 Not Found)
  - [x] Delete another user's medication (404 Not Found)

#### Blood Pressure API (`test_blood_pressure_api.py`)
- **`GET /api/blood-pressure-logs`**
  - [x] Success - With Results (200 OK)
  - [x] Success - Empty List (200 OK)
- **`POST /api/blood-pressure-logs`**
  - [x] Success (201 Created)
  - [x] Validation Error (422 Unprocessable Entity)
- **`PUT /api/blood-pressure-logs/{log_id}`**
  - [x] Success (200 OK)
  - [x] Log Not Found (404 Not Found)
  - [x] Update another user's log (404 Not Found)
  - [x] Empty Payload (400 Bad Request)
- **`DELETE /api/blood-pressure-logs/{log_id}`**
  - [x] Success (200 OK)
  - [x] Log Not Found (404 Not Found)
  - [x] Delete another user's log (404 Not Found)
- **`GET /api/blood-pressure-logs/export`**
  - [x] Success (200 OK)
  - [x] Success with empty data (200 OK)

---

### Next Steps

1.  Complete all `[ ]` items in the integration test list.
2.  Run `pytest --cov=main` to check final test coverage.
3.  Refactor any tests for clarity and efficiency.
