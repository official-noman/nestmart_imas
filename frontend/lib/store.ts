import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  // Add other user fields as needed
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (access: string, refresh: string, user?: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!Cookies.get('access_token'),
  user: null,
  login: (access, refresh, user) => {
    Cookies.set('access_token', access, { expires: 1 }); // expires in 1 day
    Cookies.set('refresh_token', refresh, { expires: 7 }); // expires in 7 days
    set({ isAuthenticated: true, user: user || null });
  },
  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    set({ isAuthenticated: false, user: null });
  },
}));
