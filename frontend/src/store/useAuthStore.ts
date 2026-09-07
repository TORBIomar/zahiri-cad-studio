import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

export type UserRole = 'ROLE_ENGINEER' | 'ROLE_OPERATOR' | 'ROLE_ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  company?: string;
  createdAt?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  company?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isGuest: boolean;
  isAuthModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  backendConnected: boolean;

  setAuthModalOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message: string }>;
  loginWithDemo: (role: UserRole) => Promise<{ success: boolean; message: string }>;
  continueAsGuest: () => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

const DEMO_ACCOUNTS: Record<UserRole, { email: string; pass: string; name: string; company: string }> = {
  ROLE_ENGINEER: {
    email: 'engineer@cad.com',
    pass: '123',
    name: 'Lead CAD Engineer',
    company: 'Zahiri Metal R&D Lab',
  },
  ROLE_OPERATOR: {
    email: 'cnc@cad.com',
    pass: '123',
    name: 'Laser CNC Operator',
    company: 'Zahiri Metal Laser Bay',
  },
  ROLE_ADMIN: {
    email: 'admin@cad.com',
    pass: '123',
    name: 'Plant Administrator',
    company: 'Zahiri Metal Industrial HQ',
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('zahiri_cad_auth_token'),
  isGuest: localStorage.getItem('zahiri_cad_is_guest') !== 'false',
  isAuthModalOpen: false,
  isLoading: false,
  error: null,
  backendConnected: false,

  setAuthModalOpen: (open: boolean) => set({ isAuthModalOpen: open, error: null }),
  setError: (error: string | null) => set({ error }),

  initAuth: async () => {
    const token = localStorage.getItem('zahiri_cad_auth_token');
    const localUserJson = localStorage.getItem('zahiri_cad_user');

    if (token) {
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data) {
          set({
            user: res.data,
            token,
            isGuest: false,
            backendConnected: true,
          });
          localStorage.setItem('zahiri_cad_user', JSON.stringify(res.data));
          localStorage.setItem('zahiri_cad_is_guest', 'false');
          return;
        }
      } catch (err) {
        // Backend offline or token expired; if local user cached, preserve offline session
        if (localUserJson) {
          try {
            const cachedUser = JSON.parse(localUserJson);
            set({
              user: cachedUser,
              token,
              isGuest: false,
              backendConnected: false,
            });
            return;
          } catch {
            // ignore
          }
        }
      }
    }

    // If no active authenticated session, remain in guest preview mode
    set({ isGuest: true, user: null });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const data = response.data;
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        company: data.company,
      };

      localStorage.setItem('zahiri_cad_auth_token', data.token);
      localStorage.setItem('zahiri_cad_user', JSON.stringify(userProfile));
      localStorage.setItem('zahiri_cad_is_guest', 'false');

      set({
        user: userProfile,
        token: data.token,
        isGuest: false,
        isAuthModalOpen: false,
        isLoading: false,
        backendConnected: true,
      });

      return { success: true, message: `Welcome back, ${userProfile.fullName}!` };
    } catch (err: any) {
      // Offline fallback: check if demo credentials match
      const matchingDemo = Object.values(DEMO_ACCOUNTS).find(
        (acc) => acc.email.toLowerCase() === email.toLowerCase() && acc.pass === password
      );

      if (matchingDemo) {
        const role = Object.keys(DEMO_ACCOUNTS).find(
          (r) => DEMO_ACCOUNTS[r as UserRole].email === matchingDemo.email
        ) as UserRole;
        const mockProfile: UserProfile = {
          id: `local-usr-${role.toLowerCase()}`,
          email: matchingDemo.email,
          fullName: matchingDemo.name,
          role,
          company: matchingDemo.company,
        };
        const mockToken = `mock-jwt-token-${Date.now()}`;
        localStorage.setItem('zahiri_cad_auth_token', mockToken);
        localStorage.setItem('zahiri_cad_user', JSON.stringify(mockProfile));
        localStorage.setItem('zahiri_cad_is_guest', 'false');

        set({
          user: mockProfile,
          token: mockToken,
          isGuest: false,
          isAuthModalOpen: false,
          isLoading: false,
          backendConnected: false,
        });

        return { success: true, message: `Logged in offline as ${mockProfile.fullName}` };
      }

      const errMsg =
        err.response?.data?.message || 'Authentication failed. Check credentials or verify backend connection.';
      set({ error: errMsg, isLoading: false });
      return { success: false, message: errMsg };
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/register', payload);
      const data = response.data;
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        company: data.company,
      };

      localStorage.setItem('zahiri_cad_auth_token', data.token);
      localStorage.setItem('zahiri_cad_user', JSON.stringify(userProfile));
      localStorage.setItem('zahiri_cad_is_guest', 'false');

      set({
        user: userProfile,
        token: data.token,
        isGuest: false,
        isAuthModalOpen: false,
        isLoading: false,
        backendConnected: true,
      });

      return { success: true, message: `Account created successfully. Welcome, ${userProfile.fullName}!` };
    } catch (err: any) {
      // Offline fallback: allow local signup if backend is down
      const mockProfile: UserProfile = {
        id: `local-usr-${Date.now()}`,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role || 'ROLE_ENGINEER',
        company: payload.company || 'Zahiri Metal',
      };
      const mockToken = `mock-jwt-token-${Date.now()}`;
      localStorage.setItem('zahiri_cad_auth_token', mockToken);
      localStorage.setItem('zahiri_cad_user', JSON.stringify(mockProfile));
      localStorage.setItem('zahiri_cad_is_guest', 'false');

      set({
        user: mockProfile,
        token: mockToken,
        isGuest: false,
        isAuthModalOpen: false,
        isLoading: false,
        backendConnected: false,
      });

      return {
        success: true,
        message: `Account created in standalone offline mode: ${mockProfile.fullName}`,
      };
    }
  },

  loginWithDemo: async (role: UserRole) => {
    const demo = DEMO_ACCOUNTS[role];
    set({ isLoading: true, error: null });

    // Try authenticating with backend; if not yet registered, attempt registration first
    try {
      const loginRes = await apiClient.post('/auth/login', {
        email: demo.email,
        password: demo.pass,
      });
      const data = loginRes.data;
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        company: data.company,
      };
      localStorage.setItem('zahiri_cad_auth_token', data.token);
      localStorage.setItem('zahiri_cad_user', JSON.stringify(userProfile));
      localStorage.setItem('zahiri_cad_is_guest', 'false');

      set({
        user: userProfile,
        token: data.token,
        isGuest: false,
        isAuthModalOpen: false,
        isLoading: false,
        backendConnected: true,
      });
      return { success: true, message: `Connected as ${demo.name}` };
    } catch (loginErr) {
      // Try registering on backend first
      try {
        const regRes = await apiClient.post('/auth/register', {
          email: demo.email,
          password: demo.pass,
          fullName: demo.name,
          role,
          company: demo.company,
        });
        const data = regRes.data;
        const userProfile: UserProfile = {
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          company: data.company,
        };
        localStorage.setItem('zahiri_cad_auth_token', data.token);
        localStorage.setItem('zahiri_cad_user', JSON.stringify(userProfile));
        localStorage.setItem('zahiri_cad_is_guest', 'false');

        set({
          user: userProfile,
          token: data.token,
          isGuest: false,
          isAuthModalOpen: false,
          isLoading: false,
          backendConnected: true,
        });
        return { success: true, message: `Registered & logged in as ${demo.name}` };
      } catch {
        // Backend not running, use local offline demo session
        const mockProfile: UserProfile = {
          id: `demo-${role.toLowerCase()}`,
          email: demo.email,
          fullName: demo.name,
          role,
          company: demo.company,
        };
        const mockToken = `mock-token-${role}-${Date.now()}`;
        localStorage.setItem('zahiri_cad_auth_token', mockToken);
        localStorage.setItem('zahiri_cad_user', JSON.stringify(mockProfile));
        localStorage.setItem('zahiri_cad_is_guest', 'false');

        set({
          user: mockProfile,
          token: mockToken,
          isGuest: false,
          isAuthModalOpen: false,
          isLoading: false,
          backendConnected: false,
        });
        return { success: true, message: `Activated demo session for ${demo.name}` };
      }
    }
  },

  continueAsGuest: () => {
    localStorage.removeItem('zahiri_cad_auth_token');
    localStorage.removeItem('zahiri_cad_user');
    localStorage.setItem('zahiri_cad_is_guest', 'true');
    set({
      user: null,
      token: null,
      isGuest: true,
      isAuthModalOpen: false,
      error: null,
    });
  },

  logout: () => {
    localStorage.removeItem('zahiri_cad_auth_token');
    localStorage.removeItem('zahiri_cad_user');
    localStorage.setItem('zahiri_cad_is_guest', 'true');
    set({
      user: null,
      token: null,
      isGuest: true,
      isAuthModalOpen: false,
      error: null,
    });
  },
}));
