import { useMemo } from 'react';
import { Driver, Lap } from '@/lib/api/types';
import { formatSectorTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface SectorPerformanceTableProps {
    laps: Lap[];
    drivers: Driver[];
    selectedDrivers: number[];
    targetLap?: number; // If not provided, defaults to the fastest lap of the session (or personal best)
}

export function SectorPerformanceTable({
    laps,
    drivers,
    selectedDrivers,
    targetLap,
}: SectorPerformanceTableProps) {
    // Calculate sector stats
    const sectorStats = useMemo(() => {
        if (!laps || laps.length === 0) return null;

        // 1. Find overall best sectors (Purple)
        const bestSectors = {
            s1: Math.min(...laps.filter(l => l.duration_sector_1).map(l => l.duration_sector_1!)),
            s2: Math.min(...laps.filter(l => l.duration_sector_2).map(l => l.duration_sector_2!)),
            s3: Math.min(...laps.filter(l => l.duration_sector_3).map(l => l.duration_sector_3!)),
        };

        // 2. Process data for selected drivers
        const driverStats = selectedDrivers.map(driverNum => {
            const driverLaps = laps.filter(l => l.driver_number === driverNum);
            const driver = drivers.find(d => d.driver_number === driverNum);

            if (driverLaps.length === 0 || !driver) return null;

            // Determine which lap to show
            let lapToShow: Lap | undefined;
            if (targetLap) {
                lapToShow = driverLaps.find(l => l.lap_number === targetLap);
            } else {
                // Default to personal best lap
                lapToShow = driverLaps.reduce((best, current) => {
                    if (!best.lap_duration) return current;
                    if (!current.lap_duration) return best;
                    return current.lap_duration < best.lap_duration ? current : best;
                }, driverLaps[0]);
            }

            if (!lapToShow) return null;

            // Personal best sectors (Green)
            const personalBestSectors = {
                s1: Math.min(...driverLaps.filter(l => l.duration_sector_1).map(l => l.duration_sector_1!)),
                s2: Math.min(...driverLaps.filter(l => l.duration_sector_2).map(l => l.duration_sector_2!)),
                s3: Math.min(...driverLaps.filter(l => l.duration_sector_3).map(l => l.duration_sector_3!)),
            };

            return {
                driver,
                lap: lapToShow,
                personalBestSectors,
            };
        }).filter((stat): stat is NonNullable<typeof stat> => stat !== null);

        // Sort by lap time (ascending)
        driverStats.sort((a, b) => (a.lap.lap_duration || Infinity) - (b.lap.lap_duration || Infinity));

        return { bestSectors, driverStats };
    }, [laps, drivers, selectedDrivers, targetLap]);

    if (!sectorStats || sectorStats.driverStats.length === 0) {
        return <div className="text-center text-gray-500">No data available for the selected criteria.</div>;
    }

    const { bestSectors, driverStats } = sectorStats;
    const leaderTime = driverStats[0]?.lap.lap_duration || 0;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lap</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sector 1</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sector 2</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sector 3</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lap Time</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Delta</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {driverStats.map((stat, index) => {
                        const { driver, lap, personalBestSectors } = stat;
                        const delta = (lap.lap_duration || 0) - leaderTime;

                        const getSectorClass = (time: number | null, sector: 's1' | 's2' | 's3') => {
                            if (!time) return '';
                            if (time <= bestSectors[sector]) return 'text-purple-600 font-bold'; // Purple sector
                            if (time <= personalBestSectors[sector]) return 'text-green-600 font-bold'; // Personal best
                            return 'text-gray-900'; // Normal
                        };

                        return (
                            <tr key={driver.driver_number}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div
                                            className="h-3 w-3 rounded-full mr-2"
                                            style={{ backgroundColor: `#${driver.team_colour}` }}
                                        />
                                        <span className="font-medium text-gray-900">{driver.name_acronym}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lap.lap_number}</td>
                                <td className={cn("px-6 py-4 whitespace-nowrap text-sm text-right", getSectorClass(lap.duration_sector_1, 's1'))}>
                                    {formatSectorTime(lap.duration_sector_1)}
                                </td>
                                <td className={cn("px-6 py-4 whitespace-nowrap text-sm text-right", getSectorClass(lap.duration_sector_2, 's2'))}>
                                    {formatSectorTime(lap.duration_sector_2)}
                                </td>
                                <td className={cn("px-6 py-4 whitespace-nowrap text-sm text-right", getSectorClass(lap.duration_sector_3, 's3'))}>
                                    {formatSectorTime(lap.duration_sector_3)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                    {formatSectorTime(lap.lap_duration)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {index === 0 ? '-' : `+${delta.toFixed(3)}`}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
