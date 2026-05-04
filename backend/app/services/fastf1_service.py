import fastf1
from fastapi import HTTPException
from fastf1.core import Session, Laps
import pandas as pd
from typing import List, Optional
from app.models.schemas import SessionResponse, LapResponse, DriverResponse, TelemetryPoint


def get_session(year: int, event: str, session_type: str) -> Session:
    """
    Load a FastF1 session
    """
    session = fastf1.get_session(year, event, session_type)
    session.load()
    return session


def get_sessions_for_year(year: int) -> List[SessionResponse]:
    """
    Get all sessions for a given year
    Note: FastF1 doesn't have a direct API for this, so we'll need to use OpenF1 or hardcode events
    For now, returning empty list - this should be implemented with OpenF1 API
    """
    # TODO: Implement using OpenF1 API or event schedule
    return []


def get_laps_for_session(session: Session, driver_number: Optional[int] = None) -> List[LapResponse]:
    """
    Get laps for a session, optionally filtered by driver
    """
    laps: Laps = session.laps
    
    if driver_number is not None:
        laps = laps.pick_driver(driver_number)
    
    lap_list = []
    for idx, lap in laps.iterrows():
        lap_data = LapResponse(
            meeting_key=0,  # FastF1 doesn't provide this, would need OpenF1
            session_key=0,  # FastF1 doesn't provide this, would need OpenF1
            driver_number=int(lap['DriverNumber']) if pd.notna(lap['DriverNumber']) else 0,
            lap_number=int(lap['LapNumber']) if pd.notna(lap['LapNumber']) else 0,
            lap_duration=float(lap['LapTime'].total_seconds()) if pd.notna(lap['LapTime']) else None,
            duration_sector_1=float(lap['Sector1Time'].total_seconds()) if pd.notna(lap['Sector1Time']) else None,
            duration_sector_2=float(lap['Sector2Time'].total_seconds()) if pd.notna(lap['Sector2Time']) else None,
            duration_sector_3=float(lap['Sector3Time'].total_seconds()) if pd.notna(lap['Sector3Time']) else None,
            compound=str(lap['Compound']) if pd.notna(lap['Compound']) else None,
            tyre_life=int(lap['TyreLife']) if pd.notna(lap['TyreLife']) else None,
            is_pit_out_lap=bool(lap['PitOutTime']) if 'PitOutTime' in lap and pd.notna(lap['PitOutTime']) else False,
            i1_speed=int(lap['SpeedI1']) if pd.notna(lap.get('SpeedI1')) else None,
            i2_speed=int(lap['SpeedI2']) if pd.notna(lap.get('SpeedI2')) else None,
            st_speed=int(lap['SpeedST']) if pd.notna(lap.get('SpeedST')) else None,
            date_start=lap['LapStartTime'].isoformat() if pd.notna(lap.get('LapStartTime')) else None,
            total_seconds=float(lap['Time'].total_seconds()) if pd.notna(lap.get('Time')) else None,
        )
        lap_list.append(lap_data)
    
    return lap_list


def get_telemetry_for_lap(session: Session, driver_number: int, lap_number: int) -> List[TelemetryPoint]:
    """
    Get telemetry data for a specific lap
    """
    driver_laps = session.laps.pick_driver(driver_number)
    matching = driver_laps[driver_laps['LapNumber'] == lap_number]
    if len(matching) == 0:
        return []
    lap = matching.iloc[0]

    try:
        telemetry = lap.get_telemetry()
    except Exception as e:
        msg = str(e)
        print(f"[get_telemetry_for_lap] get_telemetry failed for driver={driver_number} lap={lap_number}: {msg}")
        # Distinguish "telemetry source not available" from generic errors so the
        # frontend can show a clearer message.
        if "not been loaded" in msg.lower() or "not loaded" in msg.lower():
            raise HTTPException(
                status_code=503,
                detail="このセッションのテレメトリーデータが FastF1 提供元から取得できませんでした。最近のレースでは反映に時間がかかる場合があります。時間をおいて再試行してください。",
            )
        return []

    if len(telemetry) == 0:
        return []

    # SessionTime / X / Y are optional (only present when pos_data is merged).
    # Fall back gracefully if any column is missing.
    has_session_time = 'SessionTime' in telemetry.columns
    has_x = 'X' in telemetry.columns
    has_y = 'Y' in telemetry.columns

    base_session_time = telemetry['SessionTime'].iloc[0] if has_session_time else None

    telemetry_list = []
    for idx, point in telemetry.iterrows():
        time_seconds = 0.0
        if has_session_time and base_session_time is not None and pd.notna(base_session_time):
            st = point.get('SessionTime')
            if pd.notna(st):
                try:
                    time_seconds = float((st - base_session_time).total_seconds())
                except Exception:
                    time_seconds = 0.0

        tel_point = TelemetryPoint(
            date=point['Date'].isoformat() if 'Date' in telemetry.columns and pd.notna(point['Date']) else "",
            time=time_seconds,
            x=float(point['X']) if has_x and pd.notna(point.get('X')) else 0.0,
            y=float(point['Y']) if has_y and pd.notna(point.get('Y')) else 0.0,
            speed=int(point['Speed']) if pd.notna(point.get('Speed')) else 0,
            rpm=int(point['RPM']) if pd.notna(point.get('RPM')) else 0,
            gear=int(point['nGear']) if pd.notna(point.get('nGear')) else 0,
            throttle=int(point['Throttle']) if pd.notna(point.get('Throttle')) else 0,
            brake=bool(point['Brake']) if pd.notna(point.get('Brake')) else False,
            drs=int(point['DRS']) if pd.notna(point.get('DRS')) else 0,
            distance=float(point['Distance']) if pd.notna(point.get('Distance')) else 0.0,
            rel_distance=float(point['RelativeDistance']) if pd.notna(point.get('RelativeDistance')) else 0.0,
        )
        telemetry_list.append(tel_point)

    return telemetry_list


def get_drivers_for_session(session: Session) -> List[DriverResponse]:
    """
    Get driver information for a session
    """
    drivers = session.drivers
    driver_list = []
    
    for driver_num in drivers:
        driver_info = session.get_driver(driver_num)
        driver_data = DriverResponse(
            driver_number=int(driver_num),
            name_acronym=str(driver_info['Abbreviation']) if 'Abbreviation' in driver_info else "",
            full_name=f"{driver_info.get('FirstName', '')} {driver_info.get('LastName', '')}".strip(),
            team_name=str(driver_info.get('TeamName', '')),
            team_colour=str(driver_info.get('TeamColor', '000000')),
        )
        driver_list.append(driver_data)
    
    return driver_list
