from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import LapResponse
from app.services.fastf1_service import get_session, get_laps_for_session
from app.services.session_mapper import session_key_to_fastf1_params

router = APIRouter(prefix="/api", tags=["laps"])


@router.get("/laps", response_model=List[LapResponse])
async def get_laps(
    session_key: int = Query(..., description="OpenF1 session key"),
    driver_number: Optional[int] = Query(None, description="Driver number to filter by"),
):
    """
    Get laps for a specific session using OpenF1 session_key, optionally filtered by driver
    """
    try:
        # Convert session_key to FastF1 parameters
        fastf1_params = session_key_to_fastf1_params(session_key)
        
        if not fastf1_params:
            raise HTTPException(status_code=404, detail=f"Session {session_key} not found")
        
        year, event, session_type = fastf1_params
        
        # Fetch data from FastF1
        session = get_session(year, event, session_type)
        laps = get_laps_for_session(session, driver_number)
        
        # Add session_key to response
        for lap in laps:
            lap.session_key = session_key
        
        return laps
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch laps: {str(e)}")
