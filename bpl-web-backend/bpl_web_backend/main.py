from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from .modules.profile import router as profile_router
from .modules.medications import router as medications_router
from .modules.blood_pressure_log import router as blood_pressure_log_router

app = FastAPI(
    title="BPL Web Backend API",
    description="Blood Pressure Log Web Application Backend",
    version="1.0.0"
)

# Configure CORS middleware with improved settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly allow OPTIONS
    allow_headers=[
        "*",
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Mx-ReqToken",
        "Keep-Alive",
        "X-Requested-With",
        "If-Modified-Since",
    ],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Add OPTIONS route handler for preflight requests
@app.options("/{path:path}")
async def options_handler(request: Request, path: str):
    response = Response()
    return response

# Include module routers
app.include_router(profile_router)
app.include_router(medications_router)
app.include_router(blood_pressure_log_router)

@app.get("/")
def read_root():
    return {"message": "BPL-Web Backend is running!"}




