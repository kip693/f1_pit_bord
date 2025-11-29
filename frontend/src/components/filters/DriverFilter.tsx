import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDrivers } from '@/lib/hooks/useF1Data';
import { useFavoritesStore } from '@/store/filterStore';
import { parseSessionParams, parseDriverFilterParams } from '@/lib/utils/urlParams';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { cn } from '@/lib/utils/cn';

export function DriverFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionParams = useMemo(
    () => parseSessionParams(searchParams),
    [searchParams],
  );
  const filterParams = useMemo(
    () => parseDriverFilterParams(searchParams),
    [searchParams],
  );

  const { data: drivers, isLoading, error } = useDrivers(sessionParams.session);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  // 選択中のドライバー番号
  const selectedDrivers = filterParams.drivers || [];

  // チーム別にグループ化
  const driversByTeam = useMemo(() => {
    if (!drivers) return {};

    return drivers.reduce(
      (acc, driver) => {
        if (!acc[driver.team_name]) {
          acc[driver.team_name] = [];
        }
        acc[driver.team_name].push(driver);
        return acc;
      },
      {} as Record<string, typeof drivers>,
    );
  }, [drivers]);

  const toggleDriver = (driverNumber: number) => {
    const newParams = new URLSearchParams(searchParams);
    const current = selectedDrivers;

    const updated = current.includes(driverNumber)
      ? current.filter((n) => n !== driverNumber)
      : [...current, driverNumber];

    if (updated.length > 0) {
      newParams.set('drivers', updated.join(','));
    } else {
      newParams.delete('drivers');
    }

    setSearchParams(newParams);
  };

  const selectAll = () => {
    if (!drivers) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set(
      'drivers',
      drivers.map((d) => d.driver_number).join(','),
    );
    setSearchParams(newParams);
  };

  const clearAll = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('drivers');
    setSearchParams(newParams);
  };

  const selectTeam = (teamName: string) => {
    const teamDrivers = driversByTeam[teamName] || [];
    const newParams = new URLSearchParams(searchParams);
    const teamNumbers = teamDrivers.map((d) => d.driver_number);

    // 現在の選択に追加
    const updated = [...new Set([...selectedDrivers, ...teamNumbers])];
    newParams.set('drivers', updated.join(','));
    setSearchParams(newParams);
  };

  if (!sessionParams.session) {
    return (
      <div className="text-center text-gray-500">
        セッションを選択してください
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="ドライバーデータの取得に失敗しました" />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      {/* コントロールボタン */}
      <div className="flex gap-2">
        <button
          onClick={selectAll}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          全選択
        </button>
        <button
          onClick={clearAll}
          className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
        >
          全解除
        </button>
      </div>

      {/* チーム別ドライバー一覧 */}
      <div className="space-y-4">
        {Object.entries(driversByTeam).map(([teamName, teamDrivers]) => (
          <div key={teamName} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{teamName}</h3>
              <button
                onClick={() => selectTeam(teamName)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                チーム選択
              </button>
            </div>
            <div className="space-y-2">
              {teamDrivers.map((driver) => (
                <label
                  key={driver.driver_number}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors',
                    selectedDrivers.includes(driver.driver_number)
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedDrivers.includes(driver.driver_number)}
                    onChange={() => toggleDriver(driver.driver_number)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: `#${driver.team_colour}` }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {driver.name_acronym}
                      </span>
                      <span className="text-sm text-gray-500">
                        #{driver.driver_number}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {driver.broadcast_name}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(driver.driver_number);
                    }}
                    className={cn(
                      'text-xl transition-colors',
                      isFavorite(driver.driver_number)
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-500',
                    )}
                  >
                    ★
                  </button>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 選択中のドライバー数 */}
      {selectedDrivers.length > 0 && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          {selectedDrivers.length}名のドライバーが選択されています
        </div>
      )}
    </div>
  );
}
