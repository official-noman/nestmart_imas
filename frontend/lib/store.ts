import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id?: string | number;
  email: string;
  username?: string;
  role?: string;
  // Add other user fields as needed
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (access: string, refresh: string, user?: User) => void;
  logout: () => void;
}

const getUserFromCookie = (): User | null => {
  const userStr = Cookies.get('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!Cookies.get('access_token'),
  user: getUserFromCookie(),
  login: (access, refresh, user) => {
    Cookies.set('access_token', access, { expires: 1 }); // expires in 1 day
    Cookies.set('refresh_token', refresh, { expires: 7 }); // expires in 7 days
    if (user) {
      Cookies.set('user', JSON.stringify(user), { expires: 1 });
    }
    set({ isAuthenticated: true, user: user || null });
  },
  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('user');
    set({ isAuthenticated: false, user: null });
  },
}));
