from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.models.schemas import SessionResponse
from app.services.fastf1_service import get_sessions_for_year

router = APIRouter(prefix="/api", tags=["sessions"])


@router.get("/sessions/{year}", response_model=List[SessionResponse])
async def get_sessions(year: int):
    """
    Get all sessions for a given year
    """
    try:
        sessions = get_sessions_for_year(year)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sessions: {str(e)}")
