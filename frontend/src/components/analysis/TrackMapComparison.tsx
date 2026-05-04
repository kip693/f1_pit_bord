import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
                {t('trackMap.selectAtLeastOneDriver')}
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
        return <ErrorMessage message={t('trackMap.telemetryFetchFailed', { message: error.message })} />;
    }

    if (traces.length === 0) {
        // Diagnostics: which condition failed for each selected driver?
        const reasons = selectedDrivers.map((driverNumber, i) => {
            const points = queries[i]?.data;
            const lapNumber = selectedLapByDriver[driverNumber];
            const driverLaps = lapsByDriver.get(driverNumber);
            const lap = driverLaps?.find((l) => l.lap_number === lapNumber);
            const driver = drivers.find((d) => d.driver_number === driverNumber);
            const hasLapsList = driverLaps && driverLaps.length > 0;
            return {
                driverNumber,
                abbr: driver?.name_acronym ?? `#${driverNumber}`,
                hasDriverInfo: !!driver,
                hasAnyLaps: !!hasLapsList,
                lapCount: driverLaps?.length ?? 0,
                selectedLap: lapNumber ?? null,
                selectedLapExists: !!lap,
                telemetryPoints: points?.length ?? 0,
                queryStatus: queries[i]?.status,
            };
        });
        console.warn('[TrackMapComparison] No traces. Diagnostics:', reasons);
        const totalLaps = reasons.reduce((s, r) => s + r.lapCount, 0);
        const totalPoints = reasons.reduce((s, r) => s + r.telemetryPoints, 0);
        return (
            <div className="space-y-2 text-sm text-gray-600">
                <p>{t('trackMap.noLapData')}</p>
                <p className="text-xs text-gray-500">
                    {t('trackMap.diagnosticsTotals', { laps: totalLaps, points: totalPoints })}
                    {totalLaps === 0 && t('trackMap.diagnosticsNoLapsHint')}
                </p>
                <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">{t('trackMap.perDriverState')}</summary>
                    <ul className="mt-1 ml-4 list-disc">
                        {reasons.map((r) => (
                            <li key={r.driverNumber}>
                                {t('trackMap.perDriverDetail', {
                                    abbr: r.abbr,
                                    lapCount: r.lapCount,
                                    selectedLap: r.selectedLap ?? t('trackMap.lapNoneLabel'),
                                    notFoundSuffix:
                                        r.selectedLap && !r.selectedLapExists
                                            ? t('trackMap.lapNotFoundSuffix')
                                            : '',
                                    telemetryPoints: r.telemetryPoints,
                                })}
                            </li>
                        ))}
                    </ul>
                </details>
            </div>
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
    const { t } = useTranslation();
    const maxDuration = useMemo(
        () => Math.max(...traces.map((t) => t.lapDuration)),
        [traces],
    );

    // CSS-pixel dash pattern for legend swatches (24px-wide swatch).
    // Same logic as SVG dashByDriver: same-color drivers get progressive patterns.
    const legendDashByDriver = useMemo(() => {
        const cssPatterns: (string | undefined)[] = [
            undefined, // solid
            '6 3',     // long-dash
            '1.5 3',   // dot
            '6 2 1 2', // dash-dot
        ];
        const seen = new Map<string, number>();
        const map = new Map<number, string | undefined>();
        for (const t of traces) {
            const key = t.color.toLowerCase();
            const idx = seen.get(key) ?? 0;
            seen.set(key, idx + 1);
            map.set(t.driverNumber, cssPatterns[idx % cssPatterns.length]);
        }
        return map;
    }, [traces]);

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
                {traces.map((tr) => {
                    const driverLaps = lapsByDriver.get(tr.driverNumber) ?? [];
                    const fastestLap = fastestByDriver.get(tr.driverNumber);
                    const selected = selectedLapByDriver[tr.driverNumber];
                    const dash = legendDashByDriver.get(tr.driverNumber);
                    return (
                        <div
                            key={tr.driverNumber}
                            className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5"
                        >
                            <svg
                                width="24"
                                height="10"
                                viewBox="0 0 24 10"
                                aria-hidden
                            >
                                <line
                                    x1={0}
                                    y1={5}
                                    x2={24}
                                    y2={5}
                                    stroke={tr.color}
                                    strokeWidth={2.5}
                                    strokeDasharray={dash}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="text-sm font-bold text-gray-900">{tr.abbr}</span>
                            <select
                                value={selected ?? ''}
                                onChange={(e) =>
                                    onLapChange(tr.driverNumber, parseInt(e.target.value, 10))
                                }
                                className="rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                            >
                                {driverLaps.map((l) => (
                                    <option key={l.lap_number} value={l.lap_number}>
                                        {t('trackMap.lapLabel', {
                                            lapNumber: l.lap_number,
                                            lapTime: formatLapTime(l.lap_duration!),
                                        })}
                                        {l.lap_number === fastestLap ? ' ⚡' : ''}
                                    </option>
                                ))}
                            </select>
                            <span className="text-xs text-gray-500 tabular-nums">
                                {formatLapTime(tr.lapDuration)}
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
                    {isPlaying ? t('trackMap.pause') : t('trackMap.play')}
                </button>
                <button
                    onClick={handleReset}
                    className="rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                >
                    {t('trackMap.reset')}
                </button>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">{t('trackMap.speed')}</span>
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
                    {t('trackMap.showBrakingPoints')}
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

    // Compute dash patterns to disambiguate same-team (same-color) drivers.
    // First driver in a color: solid. Second: long-dash. Third: dot. Fourth: dash-dot.
    const dashByDriver = useMemo(() => {
        const scale = Math.max(
            (function () {
                let mx = -Infinity,
                    nx = Infinity,
                    my = -Infinity,
                    ny = Infinity;
                for (const t of traces)
                    for (const p of t.points) {
                        if (p.x > mx) mx = p.x;
                        if (p.x < nx) nx = p.x;
                        if (-p.y > my) my = -p.y;
                        if (-p.y < ny) ny = -p.y;
                    }
                return Math.max(mx - nx, my - ny);
            })(),
            1,
        );
        const u = scale * 0.005;
        const patterns: (string | undefined)[] = [
            undefined,
            `${u * 5},${u * 3}`,
            `${u * 1},${u * 2.5}`,
            `${u * 5},${u * 2},${u * 1},${u * 2}`,
        ];
        const seen = new Map<string, number>();
        const map = new Map<number, string | undefined>();
        for (const t of traces) {
            const key = t.color.toLowerCase();
            const idx = seen.get(key) ?? 0;
            seen.set(key, idx + 1);
            map.set(t.driverNumber, patterns[idx % patterns.length]);
        }
        return map;
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
                return {
                    driverNumber: t.driverNumber,
                    color: t.color,
                    d,
                    dash: dashByDriver.get(t.driverNumber),
                };
            }),
        [traces, dashByDriver],
    );

    // Brake-on segments per trace (rendered as separate red path overlay)
    const brakeSegments = useMemo(() => {
        const result: { driverNumber: number; color: string; d: string; dash?: string }[] = [];
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
            result.push({
                driverNumber: t.driverNumber,
                color: t.color,
                d: segs.join(' '),
                dash: dashByDriver.get(t.driverNumber),
            });
        }
        return result;
    }, [traces, dashByDriver]);

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
                        strokeDasharray={p.dash}
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
                            strokeDasharray={b.dash}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    ))}

                {/* Braking start points: filled triangles + small abbr label */}
                {showBraking &&
                    traces.flatMap((t, traceIdx) =>
                        t.brakingPoints.map((bp, idx) => {
                            // Stagger overlapping triangles by trace index so they don't fully overlap
                            const offset = (traceIdx - (traces.length - 1) / 2) * brakingTriR * 0.6;
                            const cx = bp.x + offset;
                            const cy = -bp.y - offset;
                            return (
                                <g key={`${t.driverNumber}-bp-${idx}`}>
                                    <polygon
                                        points={trianglePoints(cx, cy, brakingTriR)}
                                        fill={t.color}
                                        stroke="#fff"
                                        strokeWidth={brakingTriR * 0.25}
                                        strokeLinejoin="round"
                                    />
                                    <text
                                        x={cx}
                                        y={cy + brakingTriR * 0.3}
                                        textAnchor="middle"
                                        fontSize={brakingTriR * 0.85}
                                        fontWeight="bold"
                                        fill="#fff"
                                        pointerEvents="none"
                                    >
                                        {t.abbr}
                                    </text>
                                </g>
                            );
                        }),
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
