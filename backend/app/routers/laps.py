from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import LapResponse
from app.services.fastf1_service import get_session, get_laps_for_session

router = APIRouter(prefix="/api", tags=["laps"])


@router.get("/laps", response_model=List[LapResponse])
async def get_laps(
    year: int = Query(..., description="Year of the event"),
    event: str = Query(..., description="Event name or round number"),
    session_type: str = Query(..., description="Session type (e.g., 'R' for Race, 'Q' for Qualifying)"),
    driver_number: Optional[int] = Query(None, description="Driver number to filter by"),
):
    """
    Get laps for a specific session, optionally filtered by driver
    """
    try:
        session = get_session(year, event, session_type)
        laps = get_laps_for_session(session, driver_number)
        return laps
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch laps: {str(e)}")
