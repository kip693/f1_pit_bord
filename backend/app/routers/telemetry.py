from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.models.schemas import TelemetryPoint, DriverResponse
from app.services.fastf1_service import get_session, get_telemetry_for_lap, get_drivers_for_session

router = APIRouter(prefix="/api", tags=["telemetry"])


@router.get("/telemetry", response_model=List[TelemetryPoint])
async def get_telemetry(
    year: int = Query(..., description="Year of the event"),
    event: str = Query(..., description="Event name or round number"),
    session_type: str = Query(..., description="Session type"),
    driver_number: int = Query(..., description="Driver number"),
    lap_number: int = Query(..., description="Lap number"),
):
    """
    Get telemetry data for a specific lap
    """
    try:
        session = get_session(year, event, session_type)
        telemetry = get_telemetry_for_lap(session, driver_number, lap_number)
        return telemetry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch telemetry: {str(e)}")


@router.get("/drivers", response_model=List[DriverResponse])
async def get_drivers(
    year: int = Query(..., description="Year of the event"),
    event: str = Query(..., description="Event name or round number"),
    session_type: str = Query(..., description="Session type"),
):
    """
    Get driver information for a session
    """
    try:
        session = get_session(year, event, session_type)
        drivers = get_drivers_for_session(session)
        return drivers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch drivers: {str(e)}")
