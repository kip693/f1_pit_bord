import { Driver, Lap } from '@/lib/api/types';

interface QualifyingAnalysisProps {
    sessionKey: number;
    drivers: Driver[];
    laps: Lap[];
}

export function QualifyingAnalysis({ sessionKey, drivers, laps }: QualifyingAnalysisProps) {
    return (
        <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-900">予選分析</h1>
                <p className="mt-2 text-sm text-gray-600">
                    予選セッションのラップタイム比較（実装予定）
                    {sessionKey}
                    {drivers.length}
                    {laps.length}
                </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex min-h-[300px] items-center justify-center text-gray-500">
                    予選分析機能は現在開発中です
                </div>
            </div>
        </div>
    );
}
