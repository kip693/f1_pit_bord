import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// お気に入りドライバーの状態管理（LocalStorageに永続化）
interface FavoritesState {
  favoriteDriverNumbers: number[];
  toggleFavorite: (driverNumber: number) => void;
  addFavorite: (driverNumber: number) => void;
  removeFavorite: (driverNumber: number) => void;
  isFavorite: (driverNumber: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteDriverNumbers: [],

      toggleFavorite: (driverNumber: number) => {
        set((state) => ({
          favoriteDriverNumbers: state.favoriteDriverNumbers.includes(
            driverNumber,
          )
            ? state.favoriteDriverNumbers.filter((n) => n !== driverNumber)
            : [...state.favoriteDriverNumbers, driverNumber],
        }));
      },

      addFavorite: (driverNumber: number) => {
        set((state) => {
          if (state.favoriteDriverNumbers.includes(driverNumber)) {
            return state;
          }
          return {
            favoriteDriverNumbers: [...state.favoriteDriverNumbers, driverNumber],
          };
        });
      },

      removeFavorite: (driverNumber: number) => {
        set((state) => ({
          favoriteDriverNumbers: state.favoriteDriverNumbers.filter(
            (n) => n !== driverNumber,
          ),
        }));
      },

      isFavorite: (driverNumber: number) => {
        return get().favoriteDriverNumbers.includes(driverNumber);
      },
    }),
    {
      name: 'f1-dashboard-favorites',
    },
  ),
);

// UI状態管理（モーダル、サイドバーなど）
interface UIState {
  isSidebarOpen: boolean;
  isDriverFilterOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleDriverFilter: () => void;
  openDriverFilter: () => void;
  closeDriverFilter: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isDriverFilterOpen: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),

  toggleDriverFilter: () =>
    set((state) => ({ isDriverFilterOpen: !state.isDriverFilterOpen })),
  openDriverFilter: () => set({ isDriverFilterOpen: true }),
  closeDriverFilter: () => set({ isDriverFilterOpen: false }),
}));
