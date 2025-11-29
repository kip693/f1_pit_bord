import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RaceAnalysisPage } from '../RaceAnalysisPage';

// Mock all hooks from useF1Data
vi.mock('@/lib/hooks/useF1Data', () => ({
  useDrivers: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
  useLaps: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
  usePitStops: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
  useStints: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
  useAvailableYears: vi.fn(() => ({ data: [2024], isLoading: false, error: null })),
  useMeetings: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useSessions: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useSessionFilter: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
}));

// Mock zustand stores
vi.mock('@/store/filterStore', () => ({
  useFavoritesStore: vi.fn(() => ({
    favoriteDriverNumbers: [],
    toggleFavorite: vi.fn(),
  })),
  useUIStore: vi.fn(() => ({
    isDriverFilterExpanded: true,
    toggleDriverFilter: vi.fn(),
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('RaceAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render session selection prompt when no session is selected', () => {
    renderWithProviders(<RaceAnalysisPage />);
    expect(
      screen.getByText('左側のセレクターから年、GP、セッションを選択してください'),
    ).toBeInTheDocument();
  });

  it('should render layout with header and navigation', () => {
    renderWithProviders(<RaceAnalysisPage />);
    expect(screen.getByText('F1 Dashboard')).toBeInTheDocument();
    expect(screen.getByText('本戦分析')).toBeInTheDocument();
  });
});
