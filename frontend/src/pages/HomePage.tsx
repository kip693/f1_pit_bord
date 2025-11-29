import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

export function HomePage() {
  return (
    <Layout>
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">データ分析</h2>
        <div className="grid gap-4">
          <Link
            to="/race-analysis"
            className="block rounded-lg border-2 border-gray-200 p-6 transition-all hover:border-blue-500 hover:shadow-md"
          >
            <h3 className="text-xl font-bold text-gray-900">セッション分析</h3>
            <p className="mt-2 text-sm text-gray-600">
              レース、予選、プラクティスなど、選択したセッションに応じた詳細分析
            </p>
            <div className="mt-4 text-sm font-medium text-blue-600">
              分析ページへ →
            </div>
          </Link>

          <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 opacity-50">
            <h3 className="text-xl font-bold text-gray-900">ドライバー比較</h3>
            <p className="mt-2 text-sm text-gray-600">
              複数ドライバーのパフォーマンス比較（開発予定）
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
