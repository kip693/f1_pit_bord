from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.models.schemas import TelemetryPoint, DriverResponse
from app.services.fastf1_service import get_session, get_telemetry_for_lap, get_drivers_for_session
from app.services.session_mapper import session_key_to_fastf1_params

router = APIRouter(prefix="/api", tags=["telemetry"])


@router.get("/telemetry", response_model=List[TelemetryPoint])
async def get_telemetry(
    session_key: int = Query(..., description="OpenF1 session key"),
    driver_number: int = Query(..., description="Driver number"),
    lap_number: int = Query(..., description="Lap number"),
):
    """
    Get telemetry data for a specific lap using OpenF1 session_key
    """
    try:
        # Convert session_key to FastF1 parameters
        fastf1_params = session_key_to_fastf1_params(session_key)
        
        if not fastf1_params:
            raise HTTPException(status_code=404, detail=f"Session {session_key} not found")
        
        year, event, session_type = fastf1_params
        
        session = get_session(year, event, session_type)
        telemetry = get_telemetry_for_lap(session, driver_number, lap_number)
        return telemetry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch telemetry: {str(e)}")


@router.get("/drivers", response_model=List[DriverResponse])
async def get_drivers(
    session_key: int = Query(..., description="OpenF1 session key"),
):
    """
    Get driver information for a session using OpenF1 session_key
    """
    try:
        # Convert session_key to FastF1 parameters
        fastf1_params = session_key_to_fastf1_params(session_key)
        
        if not fastf1_params:
            raise HTTPException(status_code=404, detail=f"Session {session_key} not found")
        
        year, event, session_type = fastf1_params
        
        session = get_session(year, event, session_type)
        drivers = get_drivers_for_session(session)
        return drivers
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch drivers: {str(e)}")
