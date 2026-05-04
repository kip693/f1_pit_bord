import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SessionSelector } from '@/components/filters/SessionSelector';
import { DriverFilter } from '@/components/filters/DriverFilter';
import { cn } from '@/lib/utils/cn';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <Link to="/">
                <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 hover:text-gray-700 sm:text-3xl">
                  F1 PitBoard
                </h1>
              </Link>
              <p className="mt-1 hidden text-sm text-gray-600 sm:block">
                F1ピットウォールで観戦をもっと楽しく
              </p>
            </div>
            <div className="flex items-center gap-2">
              <nav className="hidden gap-2 sm:flex">
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
                  セッション分析
                </Link>
              </nav>
              {/* Mobile: sidebar toggle (analysis page only) */}
              {!isHomePage && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="rounded-md bg-gray-100 p-2 text-gray-700 hover:bg-gray-200 lg:hidden"
                  aria-label="フィルターを開く"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm4 8a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1zm2 8a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
                  </svg>
                </button>
              )}
              {/* Mobile: hamburger menu */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-md bg-gray-100 p-2 text-gray-700 hover:bg-gray-200 sm:hidden"
                aria-label="メニューを開く"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          {/* Mobile nav links */}
          <nav className="mt-3 flex gap-2 sm:hidden">
            <Link
              to="/"
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                location.pathname === '/'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              ホーム
            </Link>
            <Link
              to="/race-analysis"
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                location.pathname === '/race-analysis'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              セッション分析
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className={cn('grid grid-cols-1 gap-4 sm:gap-6', !isHomePage && 'lg:grid-cols-4')}>
          {/* Sidebar: filters */}
          {!isHomePage && (
            <>
              {/* Mobile overlay */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <div
                className={cn(
                  'lg:col-span-1 lg:block',
                  // Mobile: slide-in drawer
                  'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform overflow-y-auto bg-gray-50 p-4 shadow-xl transition-transform duration-300 lg:static lg:z-auto lg:w-auto lg:max-w-none lg:transform-none lg:bg-transparent lg:p-0 lg:shadow-none',
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                )}
              >
                {/* Mobile close button */}
                <div className="mb-4 flex items-center justify-between lg:hidden">
                  <h2 className="text-lg font-bold text-gray-900">フィルター</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-200"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                    <h2 className="mb-3 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
                      セッション選択
                    </h2>
                    <SessionSelector />
                  </div>

                  <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                    <h2 className="mb-3 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
                      ドライバーフィルタ
                    </h2>
                    <DriverFilter />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Main content */}
          <div className={cn(!isHomePage && 'lg:col-span-3')}>{children}</div>
        </div>
      </main>
    </div>
  );
}
