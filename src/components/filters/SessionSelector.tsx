import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAvailableYears, useMeetings, useSessions } from '@/lib/hooks/useF1Data';
import { parseSessionParams } from '@/lib/utils/urlParams';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';

export function SessionSelector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionParams = useMemo(
    () => parseSessionParams(searchParams),
    [searchParams],
  );

  const { data: years, isLoading: yearsLoading, error: yearsError } = useAvailableYears();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings(
    sessionParams.year || new Date().getFullYear(),
  );
  const { data: sessions, isLoading: sessionsLoading } = useSessions(
    sessionParams.year || new Date().getFullYear(),
  );

  // 選択されたミーティングのセッション一覧を取得
  const filteredSessions = useMemo(() => {
    if (!sessions || !sessionParams.meeting) return [];
    return sessions.filter((s) => s.meeting_key === sessionParams.meeting);
  }, [sessions, sessionParams.meeting]);

  const handleYearChange = (year: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('year', year.toString());
    newParams.delete('meeting');
    newParams.delete('session');
    setSearchParams(newParams);
  };

  const handleMeetingChange = (meetingKey: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('meeting', meetingKey.toString());
    newParams.delete('session');
    setSearchParams(newParams);
  };

  const handleSessionChange = (sessionKey: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('session', sessionKey.toString());
    setSearchParams(newParams);
  };

  if (yearsError) {
    return <ErrorMessage message="年度データの取得に失敗しました" />;
  }

  return (
    <div className="space-y-6">
      {/* 年度選択 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          シーズン
        </label>
        {yearsLoading ? (
          <Loading size="sm" />
        ) : (
          <select
            value={sessionParams.year ?? ''}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">年度を選択</option>
            {years?.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* グランプリ選択 */}
      {sessionParams.year && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            グランプリ
          </label>
          {meetingsLoading ? (
            <Loading size="sm" />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {meetings?.map((meeting) => (
                <button
                  key={meeting.meeting_key}
                  onClick={() => handleMeetingChange(meeting.meeting_key)}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    sessionParams.meeting === meeting.meeting_key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                  )}
                >
                  <div className="font-medium text-gray-900">
                    {meeting.country_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {meeting.circuit_short_name}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {formatDate(meeting.date_start)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* セッション選択 */}
      {sessionParams.meeting && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            セッション
          </label>
          {sessionsLoading ? (
            <Loading size="sm" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredSessions.map((session) => (
                <button
                  key={session.session_key}
                  onClick={() => handleSessionChange(session.session_key)}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    sessionParams.session === session.session_key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  )}
                >
                  {session.session_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
