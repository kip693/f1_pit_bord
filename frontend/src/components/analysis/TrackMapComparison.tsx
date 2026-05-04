import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchTelemetry } from '@/lib/api/fastf1';
import type { FastF1TelemetryPoint } from '@/lib/api/fastf1/types';
import type { Driver, Lap } from '@/lib/api/types';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface TrackMapComparisonProps {
    sessionKey: number;
    drivers: Driver[];
    laps: Lap[];
    selectedDrivers: number[];
}

interface DriverTrace {
    driverNumber: number;
    abbr: string;
    color: string;
    lapNumber: number;
    lapDuration: number;
    points: FastF1TelemetryPoint[];
    brakingPoints: BrakingPoint[];
}

interface BrakingPoint {
    x: number;
    y: number;
    time: number;
}

const PLAY_SPEEDS = [0.5, 1, 2, 4] as const;

export function TrackMapComparison({
    sessionKey,
    drivers,
    laps,
    selectedDrivers,
}: TrackMapComparisonProps) {
    // Group valid laps per driver, sorted by lap_number, identify fastest
    const lapsByDriver = useMemo(() => {
        const map = new Map<number, Lap[]>();
        for (const lap of laps) {
            if (lap.lap_duration == null || lap.lap_duration <= 0) continue;
            const arr = map.get(lap.driver_number) ?? [];
            arr.push(lap);
            map.set(lap.driver_number, arr);
        }
        for (const arr of map.values()) {
            arr.sort((a, b) => a.lap_number - b.lap_number);
        }
        return map;
    }, [laps]);

    const fastestByDriver = useMemo(() => {
        const map = new Map<number, number>();
        for (const [driverNum, arr] of lapsByDriver) {
            const best = arr.reduce((acc, l) =>
                acc.lap_duration! < l.lap_duration! ? acc : l,
            );
            map.set(driverNum, best.lap_number);
        }
        return map;
    }, [lapsByDriver]);

    // Selected lap per driver. Defaults to fastest.
    const [selectedLapByDriver, setSelectedLapByDriver] = useState<Record<number, number>>({});

    useEffect(() => {
        setSelectedLapByDriver((prev) => {
            const next: Record<number, number> = {};
            for (const driverNum of selectedDrivers) {
                if (prev[driverNum] != null && lapsByDriver.get(driverNum)?.some((l) => l.lap_number === prev[driverNum])) {
                    next[driverNum] = prev[driverNum];
                } else {
                    const fastest = fastestByDriver.get(driverNum);
                    if (fastest != null) next[driverNum] = fastest;
                }
            }
            return next;
        });
    }, [selectedDrivers, lapsByDriver, fastestByDriver]);

    // Fetch telemetry for each (driver, lap) pair
    const queries = useQueries({
        queries: selectedDrivers.map((driverNumber) => {
            const lapNumber = selectedLapByDriver[driverNumber];
            return {
                queryKey: ['fastf1-telemetry-raw', sessionKey, driverNumber, lapNumber],
                queryFn: () =>
                    fetchTelemetry({
                        session_key: sessionKey,
                        driver_number: driverNumber,
                        lap_number: lapNumber!,
                    }),
                enabled: lapNumber != null,
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
            };
        }),
    });

    const isLoading = queries.some((q) => q.isLoading);
    const error = queries.find((q) => q.error)?.error as Error | undefined;

    const traces: DriverTrace[] = useMemo(() => {
        const result: DriverTrace[] = [];
        for (let i = 0; i < selectedDrivers.length; i++) {
            const driverNumber = selectedDrivers[i];
            const points = queries[i]?.data;
            const lapNumber = selectedLapByDriver[driverNumber];
            const lap = lapsByDriver.get(driverNumber)?.find((l) => l.lap_number === lapNumber);
            const driver = drivers.find((d) => d.driver_number === driverNumber);
            if (!points || points.length === 0 || !lap || !driver) continue;

            // Detect braking start points: brake transitions false → true
            const brakingPoints: BrakingPoint[] = [];
            for (let j = 1; j < points.length; j++) {
                if (points[j].brake && !points[j - 1].brake) {
                    brakingPoints.push({ x: points[j].x, y: points[j].y, time: points[j].time });
                }
            }

            result.push({
                driverNumber,
                abbr: driver.name_acronym || String(driverNumber),
                color: `#${driver.team_colour || '888888'}`,
                lapNumber: lap.lap_number,
                lapDuration: lap.lap_duration!,
                points,
                brakingPoints,
            });
        }
        return result;
    }, [queries, selectedDrivers, selectedLapByDriver, lapsByDriver, drivers]);

    if (selectedDrivers.length < 1) {
        return (
            <p className="text-sm text-gray-600">
                ドライバーフィルタから1人以上選択してください
            </p>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loading color="blue" size="lg" />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={`テレメトリー取得に失敗: ${error.message}`} />;
    }

    if (traces.length === 0) {
        return (
            <p className="text-sm text-gray-600">
                選択されたドライバーのラップデータが見つかりません
            </p>
        );
    }

    return (
        <TrackMapPlayer
            traces={traces}
            lapsByDriver={lapsByDriver}
            fastestByDriver={fastestByDriver}
            selectedLapByDriver={selectedLapByDriver}
            onLapChange={(driverNumber, lapNumber) =>
                setSelectedLapByDriver((prev) => ({ ...prev, [driverNumber]: lapNumber }))
            }
        />
    );
}

// ---------------------------------------------------------------------------
// Player: holds animation state, renders TrackMap + controls
// ---------------------------------------------------------------------------

function TrackMapPlayer({
    traces,
    lapsByDriver,
    fastestByDriver,
    selectedLapByDriver,
    onLapChange,
}: {
    traces: DriverTrace[];
    lapsByDriver: Map<number, Lap[]>;
    fastestByDriver: Map<number, number>;
    selectedLapByDriver: Record<number, number>;
    onLapChange: (driverNumber: number, lapNumber: number) => void;
}) {
    const maxDuration = useMemo(
        () => Math.max(...traces.map((t) => t.lapDuration)),
        [traces],
    );

    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState<number>(1);
    const [showBraking, setShowBraking] = useState(true);

    // Reset playback when traces change (e.g. lap changed)
    const traceSig = useMemo(
        () => traces.map((t) => `${t.driverNumber}:${t.lapNumber}`).join(','),
        [traces],
    );
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
    }, [traceSig]);

    const rafRef = useRef<number | null>(null);
    const lastTickRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isPlaying) {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            lastTickRef.current = null;
            return;
        }

        const tick = (now: number) => {
            if (lastTickRef.current == null) lastTickRef.current = now;
            const dtMs = now - lastTickRef.current;
            lastTickRef.current = now;
            setCurrentTime((prev) => {
                const next = prev + (dtMs / 1000) * speed;
                if (next >= maxDuration) {
                    setIsPlaying(false);
                    return maxDuration;
                }
                return next;
            });
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, speed, maxDuration]);

    const handlePlayPause = () => {
        if (currentTime >= maxDuration) setCurrentTime(0);
        setIsPlaying((p) => !p);
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPlaying(false);
        setCurrentTime(parseFloat(e.target.value));
    };

    return (
        <div className="space-y-4">
            <TrackMap traces={traces} currentTime={currentTime} showBraking={showBraking} />

            {/* Per-driver lap selector + legend */}
            <div className="flex flex-wrap gap-3">
                {traces.map((t) => {
                    const driverLaps = lapsByDriver.get(t.driverNumber) ?? [];
                    const fastestLap = fastestByDriver.get(t.driverNumber);
                    const selected = selectedLapByDriver[t.driverNumber];
                    return (
                        <div
                            key={t.driverNumber}
                            className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5"
                        >
                            <span
                                className="inline-block h-3 w-4 rounded-sm"
                                style={{ backgroundColor: t.color }}
                            />
                            <span className="text-sm font-bold text-gray-900">{t.abbr}</span>
                            <select
                                value={selected ?? ''}
                                onChange={(e) =>
                                    onLapChange(t.driverNumber, parseInt(e.target.value, 10))
                                }
                                className="rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                            >
                                {driverLaps.map((l) => (
                                    <option key={l.lap_number} value={l.lap_number}>
                                        Lap {l.lap_number} ({formatLapTime(l.lap_duration!)})
                                        {l.lap_number === fastestLap ? ' ⚡' : ''}
                                    </option>
                                ))}
                            </select>
                            <span className="text-xs text-gray-500 tabular-nums">
                                {formatLapTime(t.lapDuration)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3">
                <button
                    onClick={handlePlayPause}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    {isPlaying ? '一時停止' : '再生'}
                </button>
                <button
                    onClick={handleReset}
                    className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                >
                    リセット
                </button>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">速度:</span>
                    {PLAY_SPEEDS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`rounded px-2 py-1 text-xs font-medium ${
                                speed === s
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
                <label className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showBraking}
                        onChange={(e) => setShowBraking(e.target.checked)}
                        className="h-3.5 w-3.5 accent-red-600"
                    />
                    ブレーキングポイント
                </label>
                <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                    <span className="font-mono text-xs text-gray-600 tabular-nums">
                        {currentTime.toFixed(2)}s
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={maxDuration}
                        step={0.05}
                        value={currentTime}
                        onChange={handleScrub}
                        className="flex-1 accent-blue-600"
                    />
                    <span className="font-mono text-xs text-gray-600 tabular-nums">
                        {maxDuration.toFixed(2)}s
                    </span>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Map: pure SVG renderer
// ---------------------------------------------------------------------------

function TrackMap({
    traces,
    currentTime,
    showBraking,
}: {
    traces: DriverTrace[];
    currentTime: number;
    showBraking: boolean;
}) {
    // Compute viewBox bounds in *rendered* coordinates (Y is flipped because SVG Y grows downward).
    const bounds = useMemo(() => {
        let minX = Infinity,
            maxX = -Infinity,
            minRY = Infinity,
            maxRY = -Infinity;
        for (const t of traces) {
            for (const p of t.points) {
                const rx = p.x;
                const ry = -p.y;
                if (rx < minX) minX = rx;
                if (rx > maxX) maxX = rx;
                if (ry < minRY) minRY = ry;
                if (ry > maxRY) maxRY = ry;
            }
        }
        const w = maxX - minX;
        const h = maxRY - minRY;
        const pad = Math.max(w, h) * 0.08;
        return { minX: minX - pad, minY: minRY - pad, w: w + pad * 2, h: h + pad * 2 };
    }, [traces]);

    // Base path per trace (full lap, low opacity)
    const paths = useMemo(
        () =>
            traces.map((t) => {
                const d = t.points
                    .map(
                        (p, i) =>
                            `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${(-p.y).toFixed(1)}`,
                    )
                    .join(' ');
                return { driverNumber: t.driverNumber, color: t.color, d };
            }),
        [traces],
    );

    // Brake-on segments per trace (rendered as separate red path overlay)
    const brakeSegments = useMemo(() => {
        const result: { driverNumber: number; color: string; d: string }[] = [];
        for (const t of traces) {
            const segs: string[] = [];
            let inBrake = false;
            for (const p of t.points) {
                if (p.brake) {
                    segs.push(`${inBrake ? 'L' : 'M'} ${p.x.toFixed(1)} ${(-p.y).toFixed(1)}`);
                    inBrake = true;
                } else {
                    inBrake = false;
                }
            }
            result.push({ driverNumber: t.driverNumber, color: t.color, d: segs.join(' ') });
        }
        return result;
    }, [traces]);

    // Position each driver's marker at currentTime via linear interpolation
    const markers = useMemo(
        () =>
            traces.map((t) => {
                const pts = t.points;
                if (pts.length === 0) return null;
                const lastT = pts[pts.length - 1].time;

                if (currentTime >= lastT) {
                    const last = pts[pts.length - 1];
                    return {
                        driverNumber: t.driverNumber,
                        abbr: t.abbr,
                        color: t.color,
                        x: last.x,
                        y: -last.y,
                        speed: last.speed,
                    };
                }

                let lo = 0,
                    hi = pts.length - 1;
                while (lo < hi - 1) {
                    const mid = (lo + hi) >>> 1;
                    if (pts[mid].time <= currentTime) lo = mid;
                    else hi = mid;
                }
                const a = pts[lo];
                const b = pts[hi];
                const ratio =
                    b.time === a.time ? 0 : (currentTime - a.time) / (b.time - a.time);
                const x = a.x + (b.x - a.x) * ratio;
                const y = a.y + (b.y - a.y) * ratio;
                const speed = a.speed + (b.speed - a.speed) * ratio;
                return {
                    driverNumber: t.driverNumber,
                    abbr: t.abbr,
                    color: t.color,
                    x,
                    y: -y,
                    speed,
                };
            }),
        [traces, currentTime],
    );

    const scale = Math.max(bounds.w, bounds.h);
    const markerR = scale * 0.012;
    const labelOffset = markerR * 1.8;
    const baseStroke = scale * 0.0035;
    const brakeStroke = scale * 0.007;
    const brakingTriR = scale * 0.014;

    const aspectRatio = bounds.w / bounds.h;

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-2">
            <svg
                viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
                preserveAspectRatio="xMidYMid meet"
                className="mx-auto block w-full"
                style={{ aspectRatio, maxHeight: '70vh' }}
            >
                {/* Base racing lines */}
                {paths.map((p) => (
                    <path
                        key={p.driverNumber}
                        d={p.d}
                        fill="none"
                        stroke={p.color}
                        strokeWidth={baseStroke}
                        strokeOpacity={0.55}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                ))}

                {/* Brake-on segments overlay (thicker, full opacity) */}
                {showBraking &&
                    brakeSegments.map((b) => (
                        <path
                            key={b.driverNumber}
                            d={b.d}
                            fill="none"
                            stroke={b.color}
                            strokeWidth={brakeStroke}
                            strokeOpacity={1}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    ))}

                {/* Braking start points: triangles */}
                {showBraking &&
                    traces.flatMap((t) =>
                        t.brakingPoints.map((bp, idx) => (
                            <polygon
                                key={`${t.driverNumber}-bp-${idx}`}
                                points={trianglePoints(bp.x, -bp.y, brakingTriR)}
                                fill="#fff"
                                stroke={t.color}
                                strokeWidth={brakingTriR * 0.3}
                            />
                        )),
                    )}

                {/* Markers */}
                {markers.map(
                    (m) =>
                        m && (
                            <g key={m.driverNumber}>
                                <circle
                                    cx={m.x}
                                    cy={m.y}
                                    r={markerR}
                                    fill={m.color}
                                    stroke="#fff"
                                    strokeWidth={markerR * 0.3}
                                />
                                <text
                                    x={m.x}
                                    y={m.y - labelOffset}
                                    textAnchor="middle"
                                    fontSize={markerR * 2}
                                    fontWeight="bold"
                                    fill={m.color}
                                    stroke="#fff"
                                    strokeWidth={markerR * 0.15}
                                    paintOrder="stroke fill"
                                >
                                    {m.abbr}
                                </text>
                            </g>
                        ),
                )}
            </svg>
        </div>
    );
}

function trianglePoints(cx: number, cy: number, r: number): string {
    // Equilateral triangle pointing up
    const top = `${cx},${cy - r}`;
    const left = `${cx - r * 0.866},${cy + r * 0.5}`;
    const right = `${cx + r * 0.866},${cy + r * 0.5}`;
    return `${top} ${left} ${right}`;
}

function formatLapTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = (seconds - m * 60).toFixed(3);
    return `${m}:${s.padStart(6, '0')}`;
}
