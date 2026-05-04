import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/lib/hooks/useF1Data';
import { parseSessionParams, parseDriverFilterParams } from '@/lib/utils/urlParams';
import { Layout } from '@/components/layout/Layout';
import { Loading } from '@/components/common/Loading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { RaceAnalysis } from '@/components/analysis/RaceAnalysis';
import { QualifyingAnalysis } from '@/components/analysis/QualifyingAnalysis';

export function SessionAnalysisPage() {
  const { t } = useTranslation();
  // URLパラメータから状態を取得
  const [searchParams] = useSearchParams();
  const sessionParams = parseSessionParams(searchParams);
  const driverFilterParams = parseDriverFilterParams(searchParams);

  // 選択されたドライバー番号
  const selectedDrivers = driverFilterParams.drivers || [];

  // セッション情報を取得
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSession(
    sessionParams.session,
  );

  // セッションが選択されていない場合
  if (!sessionParams.session) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{t('analysis.selectSessionPrompt')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('analysis.selectSessionHint')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ローディング中
  if (sessionLoading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  // エラー発生
  if (sessionError) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <ErrorMessage message={sessionError.message} />
        </div>
      </Layout>
    );
  }

  // データが存在しない
  if (!session) {
    return (
      <Layout>
        <ErrorMessage message="セッション情報の取得に失敗しました" />
      </Layout>
    );
  }

  // ドライバーが選択されていない場合
  if (selectedDrivers.length === 0) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{t('analysis.selectDriverPrompt')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('analysis.selectDriverHint')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // セッションタイプに応じて表示を切り替え
  const isRace = session.session_name === 'Race' || session.session_name === 'Sprint';

  return (
    <Layout>
      {isRace ? (
        <RaceAnalysis sessionKey={session.session_key} selectedDrivers={selectedDrivers} />
      ) : (
        <QualifyingAnalysis
          sessionKey={session.session_key}
          drivers={[]} // TODO: QualifyingAnalysis内で取得するか、ここで取得して渡す
          laps={[]} // TODO: 同上
        />
      )}
    </Layout>
  );
}
