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
  approved?: boolean;
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
  isApprovalModalOpen: boolean;
  pendingUsers: UserProfile[];
  registeredUsers: UserProfile[];
  isLoading: boolean;
  error: string | null;
  backendConnected: boolean;

  setAuthModalOpen: (open: boolean) => void;
  setApprovalModalOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; pendingApproval?: boolean }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message: string; pendingApproval?: boolean }>;
  loginWithDemo: (role: UserRole) => Promise<{ success: boolean; message: string }>;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
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

const DEFAULT_PENDING_USERS: UserProfile[] = [
  {
    id: 'usr-pending-1',
    fullName: 'Yassine Alami',
    email: 'yassine.alami@zahiri.ma',
    role: 'ROLE_ENGINEER',
    company: "Bureau d'Études R&D",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    approved: false,
  },
  {
    id: 'usr-pending-2',
    fullName: 'Hamza Tahiri',
    email: 'hamza.cnc@zahiri.ma',
    role: 'ROLE_OPERATOR',
    company: 'Atelier Découpe Laser 4-Axes',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    approved: false,
  },
];

const getStoredRegisteredUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem('zahiri_cad_registered_users');
    if (!raw) {
      localStorage.setItem('zahiri_cad_registered_users', JSON.stringify(DEFAULT_PENDING_USERS));
      return DEFAULT_PENDING_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PENDING_USERS;
  }
};

const saveStoredRegisteredUsers = (users: UserProfile[]) => {
  localStorage.setItem('zahiri_cad_registered_users', JSON.stringify(users));
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('zahiri_cad_auth_token'),
  isGuest: localStorage.getItem('zahiri_cad_is_guest') !== 'false',
  isAuthModalOpen: false,
  isApprovalModalOpen: false,
  pendingUsers: getStoredRegisteredUsers().filter((u) => !u.approved),
  registeredUsers: getStoredRegisteredUsers(),
  isLoading: false,
  error: null,
  backendConnected: false,

  setAuthModalOpen: (open: boolean) => set({ isAuthModalOpen: open, error: null }),
  setApprovalModalOpen: (open: boolean) => set({ isApprovalModalOpen: open }),
  setError: (error: string | null) => set({ error }),

  approveUser: async (userId: string) => {
    try {
      await apiClient.put(`/auth/users/${userId}/approve`);
    } catch (err) {
      console.warn('Could not sync approval to backend:', err);
    }
    const all = getStoredRegisteredUsers().map((u) =>
      u.id === userId ? { ...u, approved: true } : u
    );
    saveStoredRegisteredUsers(all);
    set({
      registeredUsers: all,
      pendingUsers: all.filter((u) => !u.approved),
    });
  },

  rejectUser: async (userId: string) => {
    try {
      await apiClient.delete(`/auth/users/${userId}`);
    } catch (err) {
      console.warn('Could not sync user deletion to backend:', err);
    }
    const all = getStoredRegisteredUsers().filter((u) => u.id !== userId);
    saveStoredRegisteredUsers(all);
    set({
      registeredUsers: all,
      pendingUsers: all.filter((u) => !u.approved),
    });
  },

  initAuth: async () => {
    // 1. Fetch live registered users from MySQL backend
    try {
      const usersRes = await apiClient.get('/auth/users');
      if (Array.isArray(usersRes.data) && usersRes.data.length > 0) {
        const mapped: UserProfile[] = usersRes.data.map((d: any) => ({
          id: d.id,
          email: d.email,
          fullName: d.fullName,
          role: d.role,
          company: d.company,
          approved: d.approved !== false,
          createdAt: d.createdAt,
        }));
        saveStoredRegisteredUsers(mapped);
        set({
          registeredUsers: mapped,
          pendingUsers: mapped.filter((u) => !u.approved),
          backendConnected: true,
        });
      }
    } catch {
      // Backend offline or unreachable
    }

    const token = localStorage.getItem('zahiri_cad_auth_token');
    const localUserJson = localStorage.getItem('zahiri_cad_user');

    if (token) {
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data) {
          set({
            user: { ...res.data, approved: res.data.approved !== false },
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
              user: { ...cachedUser, approved: true },
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

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user is in registered users list
    const registeredUsers = getStoredRegisteredUsers();
    const foundRegistered = registeredUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (foundRegistered) {
      if (foundRegistered.approved === false) {
        const errMsg = "Accès refusé : Votre compte (Ingénieur / Opérateur CNC) est en attente d'approbation par l'Administrateur Usine.";
        set({ error: errMsg, isLoading: false });
        return { success: false, pendingApproval: true, message: errMsg };
      }

      // Approved user login
      const mockToken = `mock-token-${Date.now()}`;
      localStorage.setItem('zahiri_cad_auth_token', mockToken);
      localStorage.setItem('zahiri_cad_user', JSON.stringify(foundRegistered));
      localStorage.setItem('zahiri_cad_is_guest', 'false');

      set({
        user: foundRegistered,
        token: mockToken,
        isGuest: false,
        isAuthModalOpen: false,
        isLoading: false,
        backendConnected: false,
      });

      return { success: true, message: `Bienvenue, ${foundRegistered.fullName} !` };
    }

    // 2. Check if credentials match pre-approved demo accounts
    const matchingDemo = Object.values(DEMO_ACCOUNTS).find(
      (acc) => acc.email.toLowerCase() === normalizedEmail && acc.pass === password
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
        approved: true,
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

      return { success: true, message: `Connecté en tant que ${mockProfile.fullName}` };
    }

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const data = response.data;
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        company: data.company,
        approved: data.approved !== undefined ? data.approved : true,
      };

      if (userProfile.approved === false) {
        const errMsg = "Accès refusé : Votre compte est en attente d'approbation par l'Administrateur Usine.";
        set({ error: errMsg, isLoading: false });
        return { success: false, pendingApproval: true, message: errMsg };
      }

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

      return { success: true, message: `Bienvenue, ${userProfile.fullName}!` };
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || 'Identifiants invalides ou connexion au serveur impossible.';
      set({ error: errMsg, isLoading: false });
      return { success: false, message: errMsg };
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });

    const normalizedEmail = payload.email.toLowerCase().trim();
    const targetRole = payload.role || 'ROLE_ENGINEER';

    if (targetRole === 'ROLE_ADMIN') {
      const errMsg = "L'inscription en tant qu'Administrateur Usine est interdite.";
      set({ error: errMsg, isLoading: false });
      return { success: false, message: errMsg };
    }

    // 1. Send registration to Spring Boot REST API (persists into MySQL zahiri_cad_db.users)
    try {
      const response = await apiClient.post('/auth/register', {
        email: normalizedEmail,
        password: payload.password,
        fullName: payload.fullName.trim(),
        role: targetRole,
        company: payload.company?.trim() || 'Zahiri Metal',
      });

      const data = response.data;
      const newUser: UserProfile = {
        id: String(data.id),
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        company: data.company,
        createdAt: new Date().toISOString(),
        approved: data.approved !== undefined ? data.approved : false,
      };

      const stored = getStoredRegisteredUsers().filter((u) => u.email.toLowerCase() !== normalizedEmail);
      const updated = [newUser, ...stored];
      saveStoredRegisteredUsers(updated);

      set({
        registeredUsers: updated,
        pendingUsers: updated.filter((u) => !u.approved),
        isLoading: false,
        backendConnected: true,
      });

      return {
        success: true,
        pendingApproval: true,
        message: "Compte enregistré avec succès dans la base de données MySQL ! En attente d'approbation par l'Administrateur Usine.",
      };
    } catch (apiErr: any) {
      const backendMsg = apiErr.response?.data?.message;
      if (backendMsg && apiErr.response?.status < 500) {
        set({ error: backendMsg, isLoading: false });
        return { success: false, message: backendMsg };
      }

      // 2. Offline fallback if backend is momentarily unreachable
      const registeredUsers = getStoredRegisteredUsers();
      const existing = registeredUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (existing) {
        const errMsg = `Un compte avec l'adresse email '${payload.email}' existe déjà.`;
        set({ error: errMsg, isLoading: false });
        return { success: false, message: errMsg };
      }

      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        fullName: payload.fullName.trim(),
        role: targetRole,
        company: payload.company?.trim() || 'Zahiri Metal',
        createdAt: new Date().toISOString(),
        approved: false,
      };

      const updated = [newUser, ...registeredUsers];
      saveStoredRegisteredUsers(updated);
      set({
        registeredUsers: updated,
        pendingUsers: updated.filter((u) => !u.approved),
        isLoading: false,
      });

      return {
        success: true,
        pendingApproval: true,
        message: "Demande d'accès enregistrée ! Votre profil nécessite l'approbation préalable de l'Administrateur Usine avant le premier accès.",
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
