from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import os

# Create cache directory if it doesn't exist
# Use /tmp for Cloud Run compatibility (writable, in-memory)
CACHE_DIR = "/tmp/fastf1_cache"
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# Enable FastF1 cache
fastf1.Cache.enable_cache(CACHE_DIR)

app = FastAPI(
    title="F1 Dashboard API",
    description="Backend API for F1 Dashboard using FastF1",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to F1 Dashboard API powered by FastF1"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
