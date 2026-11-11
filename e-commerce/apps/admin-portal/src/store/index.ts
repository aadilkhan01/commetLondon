import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('adminAccessToken', accessToken);
        localStorage.setItem('adminRefreshToken', refreshToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    { name: 'admin-auth-storage' }
  )
);
