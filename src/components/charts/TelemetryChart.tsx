import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { CarData, Driver } from '@/lib/api/types';

interface TelemetryChartProps {
    data: CarData[];
    data2?: CarData[];
    driver1?: Driver;
    driver2?: Driver;
    visibleSeries: {
        speed: boolean;
        rpm: boolean;
        throttle: boolean;
        brake: boolean;
        gear: boolean;
    };
}

export function TelemetryChart({
    data,
    data2,
    driver1,
    driver2,
    visibleSeries,
}: TelemetryChartProps) {
    // Merge data from both drivers if available
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const sorted1 = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (!data2 || data2.length === 0) {
            return sorted1.map((d, idx) => ({
                index: idx,
                date: d.date,
                speed1: d.speed,
                rpm1: d.rpm,
                throttle1: d.throttle,
                brake1: d.brake,
                gear1: d.n_gear,
            }));
        }

        // If we have data2, we need to align them by time or index
        const sorted2 = [...data2].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Simple approach: use index-based alignment (assuming similar sampling rates)
        const maxLength = Math.max(sorted1.length, sorted2.length);
        const merged = [];

        for (let i = 0; i < maxLength; i++) {
            merged.push({
                index: i,
                date: sorted1[i]?.date || sorted2[i]?.date,
                speed1: sorted1[i]?.speed,
                rpm1: sorted1[i]?.rpm,
                throttle1: sorted1[i]?.throttle,
                brake1: sorted1[i]?.brake,
                gear1: sorted1[i]?.n_gear,
                speed2: sorted2[i]?.speed,
                rpm2: sorted2[i]?.rpm,
                throttle2: sorted2[i]?.throttle,
                brake2: sorted2[i]?.brake,
                gear2: sorted2[i]?.n_gear,
            });
        }

        return merged;
    }, [data, data2]);

    if (chartData.length === 0) {
        return <div className="flex h-64 items-center justify-center text-gray-500">No telemetry data available</div>;
    }

    const driver1Color = '#2563eb'; // Blue
    const driver2Color = '#dc2626'; // Red

    return (
        <div className="h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#b3b3b3ff" />

                    <XAxis
                        dataKey="index"
                        type="number"
                        domain={[0, chartData.length - 1]}
                        tick={false}
                        label={{ value: 'Lap Progress', position: 'insideBottom', offset: -5 }}
                    />

                    {/* Speed Axis */}
                    <YAxis
                        yAxisId="speed"
                        orientation="left"
                        stroke={driver1Color}
                        label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 360]}
                    />

                    {/* RPM Axis */}
                    <YAxis
                        yAxisId="rpm"
                        orientation="right"
                        stroke="#dc2626"
                        hide
                        domain={[0, 13000]}
                    />

                    {/* Inputs Axis (Throttle/Brake/Gear) */}
                    <YAxis
                        yAxisId="input"
                        orientation="right"
                        stroke="#16a34a"
                        domain={[0, 110]}
                        label={{ value: 'Input (%) / Gear', angle: 90, position: 'insideRight' }}
                    />

                    <Tooltip
                        labelFormatter={(label) => `Point ${label}`}
                        contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            backgroundColor: '#ffffff',
                            color: '#1f2937'
                        }}
                        labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                    />
                    <Legend
                        content={(props) => {
                            const { payload } = props;
                            return (
                                <div className="flex flex-wrap gap-3 justify-center mt-4">
                                    {payload?.map((entry: any, index: number) => (
                                        <div key={`legend-${index}`} className="flex items-center gap-1">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor: entry.color,
                                                    opacity: entry.payload?.opacity || 1
                                                }}
                                            ></div>
                                            <span className="text-xs text-gray-700">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        }}
                    />

                    {/* Driver 1 Lines */}
                    {visibleSeries.speed && (
                        <Line
                            yAxisId="speed"
                            type="monotone"
                            dataKey="speed1"
                            stroke={driver1Color}
                            strokeWidth={2}
                            dot={false}
                            name={`${driver1?.name_acronym || 'Driver 1'} Speed`}
                        />
                    )}
                    {visibleSeries.rpm && (
                        <Line
                            yAxisId="rpm"
                            type="monotone"
                            dataKey="rpm1"
                            stroke={driver1Color}
                            strokeWidth={1}
                            dot={false}
                            name={`${driver1?.name_acronym || 'Driver 1'} RPM`}
                            opacity={0.5}
                        />
                    )}
                    {visibleSeries.throttle && (
                        <Line
                            yAxisId="input"
                            type="step"
                            dataKey="throttle1"
                            stroke="#16a34a"
                            strokeWidth={1.5}
                            dot={false}
                            name={`${driver1?.name_acronym || 'Driver 1'} Throttle`}
                        />
                    )}
                    {visibleSeries.brake && (
                        <Line
                            yAxisId="input"
                            type="step"
                            dataKey="brake1"
                            stroke="#9333ea"
                            strokeWidth={1.5}
                            dot={false}
                            name={`${driver1?.name_acronym || 'Driver 1'} Brake`}
                        />
                    )}
                    {visibleSeries.gear && (
                        <Line
                            yAxisId="input"
                            type="step"
                            dataKey="gear1"
                            stroke="#ea580c"
                            strokeWidth={1}
                            dot={false}
                            name={`${driver1?.name_acronym || 'Driver 1'} Gear`}
                        />
                    )}

                    {/* Driver 2 Lines (if available) */}
                    {data2 && driver2 && (
                        <>
                            {visibleSeries.speed && (
                                <Line
                                    yAxisId="speed"
                                    type="monotone"
                                    dataKey="speed2"
                                    stroke={driver2Color}
                                    strokeWidth={2}
                                    dot={false}
                                    name={`${driver2.name_acronym} Speed`}
                                    strokeDasharray="5 5"
                                />
                            )}
                            {visibleSeries.rpm && (
                                <Line
                                    yAxisId="rpm"
                                    type="monotone"
                                    dataKey="rpm2"
                                    stroke={driver2Color}
                                    strokeWidth={1}
                                    dot={false}
                                    name={`${driver2.name_acronym} RPM`}
                                    opacity={0.5}
                                    strokeDasharray="5 5"
                                />
                            )}
                            {visibleSeries.throttle && (
                                <Line
                                    yAxisId="input"
                                    type="step"
                                    dataKey="throttle2"
                                    stroke="#22c55e"
                                    strokeWidth={1.5}
                                    dot={false}
                                    name={`${driver2.name_acronym} Throttle`}
                                    strokeDasharray="5 5"
                                />
                            )}
                            {visibleSeries.brake && (
                                <Line
                                    yAxisId="input"
                                    type="step"
                                    dataKey="brake2"
                                    stroke="#a855f7"
                                    strokeWidth={1.5}
                                    dot={false}
                                    name={`${driver2.name_acronym} Brake`}
                                    strokeDasharray="5 5"
                                />
                            )}
                            {visibleSeries.gear && (
                                <Line
                                    yAxisId="input"
                                    type="step"
                                    dataKey="gear2"
                                    stroke="#f97316"
                                    strokeWidth={1}
                                    dot={false}
                                    name={`${driver2.name_acronym} Gear`}
                                    strokeDasharray="5 5"
                                />
                            )}
                        </>
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
