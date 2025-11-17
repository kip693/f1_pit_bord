import { useMemo } from 'react';
import type { Stint, Driver } from '@/lib/api/types';
import { getTyreColor, getTyreAbbreviation } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface PitStrategyTimelineProps {
  stints: Stint[];
  drivers: Driver[];
  selectedDrivers: number[];
  maxLap: number;
}

export function PitStrategyTimeline({
  stints,
  drivers,
  selectedDrivers,
  maxLap,
}: PitStrategyTimelineProps) {
  // ドライバー別にスティントをグループ化
  const stintsByDriver = useMemo(() => {
    const grouped = selectedDrivers.map((driverNum) => {
      const driverStints = stints
        .filter((s) => s.driver_number === driverNum)
        .sort((a, b) => a.stint_number - b.stint_number);

      const driver = drivers.find((d) => d.driver_number === driverNum);

      return {
        driver,
        stints: driverStints,
      };
    });

    return grouped.filter((g) => g.driver);
  }, [stints, drivers, selectedDrivers]);

  if (stintsByDriver.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-gray-500">
        データがありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ラップ番号の目盛り */}
      <div className="flex items-center gap-2">
        <div className="w-24"></div>
        <div className="relative flex-1">
          <div className="flex justify-between text-xs text-gray-400">
            {[0, 10, 20, 30, 40, 50, maxLap].filter(l => l <= maxLap).map((lap) => (
              <span key={lap}>Lap {lap}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ドライバーごとのスティントバー */}
      {stintsByDriver.map(({ driver, stints: driverStints }) => {
        if (!driver) return null;

        return (
          <div key={driver.driver_number} className="flex items-center gap-2">
            {/* ドライバー情報 */}
            <div className="w-24">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: `#${driver.team_colour}` }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {driver.name_acronym}
                </span>
              </div>
            </div>

            {/* スティントバー */}
            <div className="relative h-10 flex-1 rounded-md bg-gray-100">
              {driverStints.map((stint) => {
                const width = ((stint.lap_end - stint.lap_start + 1) / maxLap) * 100;
                const left = ((stint.lap_start - 1) / maxLap) * 100;

                return (
                  <div
                    key={stint.stint_number}
                    className={cn(
                      'absolute flex h-full items-center justify-center rounded border-2 border-white px-1 text-xs font-bold shadow-sm transition-all hover:z-10 hover:shadow-md',
                      stint.compound === 'HARD' || stint.compound === 'MEDIUM' ? 'text-gray-900' : 'text-white',
                    )}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: getTyreColor(stint.compound),
                    }}
                    title={`${stint.compound} (Lap ${stint.lap_start}-${stint.lap_end}, Age: ${stint.tyre_age_at_start})`}
                  >
                    <span className="truncate">
                      {getTyreAbbreviation(stint.compound)}
                      {stint.lap_end - stint.lap_start + 1 > 3 && (
                        <span className="ml-1">
                          {stint.lap_end - stint.lap_start + 1}L
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 凡例 */}
      <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-200 pt-4">
        {['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map((compound) => (
          <div key={compound} className="flex items-center gap-2">
            <div
              className="h-4 w-8 rounded border border-gray-300"
              style={{ backgroundColor: getTyreColor(compound) }}
            />
            <span className="text-xs text-gray-600">{compound}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
