from fastapi import FastAPI
from .modules.profile import router as profile_router
from .modules.medications import router as medications_router
from .modules.blood_pressure_log import router as blood_pressure_log_router

app = FastAPI(
    title="BPL Web Backend API",
    description="Blood Pressure Log Web Application Backend",
    version="1.0.0"
)

# Include module routers
app.include_router(profile_router)
app.include_router(medications_router)
app.include_router(blood_pressure_log_router)

@app.get("/")
def read_root():
    return {"message": "BPL-Web Backend is running!"}




