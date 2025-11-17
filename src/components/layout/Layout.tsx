import { Link, useLocation } from 'react-router-dom';
import { SessionSelector } from '@/components/filters/SessionSelector';
import { DriverFilter } from '@/components/filters/DriverFilter';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 hover:text-gray-700">
                  F1 Dashboard
                </h1>
              </Link>
              <p className="mt-2 text-sm text-gray-600">
                F1レースデータの可視化・分析ダッシュボード
              </p>
            </div>
            <nav className="flex gap-4">
              <Link
                to="/"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  location.pathname === '/'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
              >
                ホーム
              </Link>
              <Link
                to="/race-analysis"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  location.pathname === '/race-analysis'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
              >
                本戦分析
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* サイドバー: フィルタ */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                セッション選択
              </h2>
              <SessionSelector />
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                ドライバーフィルタ
              </h2>
              <DriverFilter />
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-3">{children}</div>
        </div>
      </main>
    </div>
  );
}
