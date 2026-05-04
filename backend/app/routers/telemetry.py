from fastapi import APIRouter, HTTPException, Query, Request
from typing import List
from app.models.schemas import TelemetryPoint, DriverResponse
from app.services.fastf1_service import get_session, get_telemetry_for_lap, get_drivers_for_session
from app.services.session_mapper import session_key_to_fastf1_params, get_session_info
from app.services import cache
from app.limiter import limiter

router = APIRouter(prefix="/api", tags=["telemetry"])


@router.get("/telemetry", response_model=List[TelemetryPoint])
@limiter.limit("20/minute")
async def get_telemetry(
    request: Request,
    session_key: int = Query(..., description="OpenF1 session key"),
    driver_number: int = Query(..., description="Driver number"),
    lap_number: int = Query(..., description="Lap number"),
):
    """
    Get telemetry data for a specific lap using OpenF1 session_key.

    Read-through GCS cache: if env var GCS_TELEMETRY_BUCKET is set and
    the session is settled (>24h after date_end), responses are served
    from / persisted to GCS. Live / unsettled sessions bypass the cache.
    """
    try:
        # 1. Cache lookup (no-op if cache disabled)
        cached = cache.get_telemetry(session_key, driver_number, lap_number)
        if cached is not None:
            return cached

        # 2. Resolve FastF1 params (also gives us date_end for cache write)
        session_info = get_session_info(session_key)
        if not session_info:
            raise HTTPException(status_code=404, detail=f"Session {session_key} not found")

        fastf1_params = session_key_to_fastf1_params(session_key)
        if not fastf1_params:
            raise HTTPException(status_code=404, detail=f"Session {session_key} not found")

        year, event, session_type = fastf1_params

        # 3. Fetch from FastF1
        session = get_session(year, event, session_type)
        telemetry = get_telemetry_for_lap(session, driver_number, lap_number)

        # 4. Cache write (only for settled sessions; non-empty payloads)
        cache.put_telemetry(
            session_key,
            driver_number,
            lap_number,
            telemetry,
            session_date_end_iso=session_info.get("date_end"),
        )

        return telemetry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch telemetry: {str(e)}")


@router.get("/drivers", response_model=List[DriverResponse])
@limiter.limit("20/minute")
async def get_drivers(
    request: Request,
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
