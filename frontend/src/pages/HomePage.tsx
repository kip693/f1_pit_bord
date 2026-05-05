import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';

export function HomePage() {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('home.dataAnalysis')}</h2>
        <div className="grid gap-4">
          <Link
            to="/race-analysis"
            className="block rounded-lg border-2 border-gray-200 p-6 transition-all hover:border-blue-500 hover:shadow-md"
          >
            <h3 className="text-xl font-bold text-gray-900">{t('home.sessionAnalysisTitle')}</h3>
            <p className="mt-2 text-sm text-gray-600">{t('home.sessionAnalysisDescription')}</p>
            <div className="mt-4 text-sm font-medium text-blue-600">{t('home.goToAnalysis')} →</div>
          </Link>

          <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 opacity-50">
            <h3 className="text-xl font-bold text-gray-900">{t('home.driverComparison')}</h3>
            <p className="mt-2 text-sm text-gray-600">{t('home.driverComparisonDescription')}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
