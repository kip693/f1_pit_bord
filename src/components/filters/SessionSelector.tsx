import { useMemo, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAvailableYears, useMeetings, useSessions } from '@/lib/hooks/useF1Data';
import { parseSessionParams } from '@/lib/utils/urlParams';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { cn } from '@/lib/utils/cn';
import { getCountryFlag } from '@/lib/utils/countryUtils';
import { formatDate } from '@/lib/utils/format';

export function SessionSelector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 選択中のミーティング情報を取得
  const selectedMeeting = useMemo(() => {
    return meetings?.find(m => m.meeting_key === sessionParams.meeting);
  }, [meetings, sessionParams.meeting]);

  // クリック外でドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <div className="relative" ref={dropdownRef}>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            グランプリ
          </label>
          {meetingsLoading ? (
            <Loading size="sm" />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {selectedMeeting ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCountryFlag(selectedMeeting.country_name)}</span>
                    <div>
                      <div className="font-bold text-gray-900">{selectedMeeting.country_name}</div>
                      <div className="text-xs text-gray-500">{selectedMeeting.circuit_short_name}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">グランプリを選択してください</span>
                )}
                <svg
                  className={cn("h-5 w-5 text-gray-400 transition-transform", isOpen && "rotate-180")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="absolute z-10 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-gray-100 bg-white/95 p-2 shadow-xl backdrop-blur-sm ring-1 ring-black ring-opacity-5">
                  <div className="space-y-1">
                    {meetings?.map((meeting) => (
                      <button
                        key={meeting.meeting_key}
                        onClick={() => {
                          handleMeetingChange(meeting.meeting_key);
                          setIsOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all',
                          sessionParams.meeting === meeting.meeting_key
                            ? 'bg-blue-50 ring-1 ring-blue-200'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="text-2xl">{getCountryFlag(meeting.country_name)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "font-bold",
                              sessionParams.meeting === meeting.meeting_key ? "text-blue-700" : "text-gray-900"
                            )}>
                              {meeting.country_name}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(meeting.date_start)}</span>
                          </div>
                          <div className="text-xs text-gray-500">{meeting.circuit_short_name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
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
