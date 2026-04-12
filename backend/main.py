from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import fastf1
import os

from app.routers import sessions, laps, telemetry
from app.limiter import limiter

# Create cache directory if it doesn't exist
CACHE_DIR = "/tmp/fastf1_cache"
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

fastf1.Cache.enable_cache(CACHE_DIR)

app = FastAPI(
    title="F1 Dashboard API",
    description="Backend API for F1 Dashboard using FastF1",
    version="1.0.0"
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(laps.router)
app.include_router(telemetry.router)

@app.get("/")
async def root():
    return {"message": "Welcome to F1 Dashboard API powered by FastF1"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
