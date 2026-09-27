import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount, Workspace } from '../types';
import {
  getCurrentUser,
  login,
  signup,
  logout,
  demoLogin,
  DEMO_USERS,
} from '../services/authService';
import {
  getActiveWorkspace,
  getUserWorkspaces,
  setActiveWorkspace,
  createWorkspace,
  joinWorkspaceByCode,
  DEFAULT_WORKSPACE,
} from '../services/workspaceService';

interface AuthContextValue {
  currentUser: UserAccount | null;
  activeWorkspace: Workspace | null;
  userWorkspaces: Workspace[];
  isLoading: boolean;
  handleLogin: (emailOrPhone: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  handleSignup: (name: string, emailOrPhone: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  handleLogout: () => Promise<void>;
  handleCreateWorkspace: (storeName: string) => Promise<{ success: boolean; workspace?: Workspace; message?: string }>;
  handleJoinWorkspace: (code: string) => Promise<{ success: boolean; workspace?: Workspace; message?: string }>;
  handleSwitchWorkspace: (workspace: Workspace) => Promise<void>;
  quickDemoLogin: (userKey: 'ramesh' | 'suresh') => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(null);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        setCurrentUserState(user);

        if (user) {
          const [activeWs, allWs] = await Promise.all([
            getActiveWorkspace(user.id),
            getUserWorkspaces(user.id),
          ]);
          setActiveWorkspaceState(activeWs || DEFAULT_WORKSPACE);
          setUserWorkspaces(allWs.length > 0 ? allWs : [DEFAULT_WORKSPACE]);
        }
      } catch (err) {
        console.warn('Error initializing auth & workspace:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    if (currentUser) {
      const allWs = await getUserWorkspaces(currentUser.id);
      setUserWorkspaces(allWs);
      const active = await getActiveWorkspace(currentUser.id);
      if (active) setActiveWorkspaceState(active);
    }
  }, [currentUser]);

  const handleLogin = useCallback(
    async (emailOrPhone: string, pin: string) => {
      const res = await login(emailOrPhone, pin);
      if (res.success && res.user) {
        setCurrentUserState(res.user);
        const [activeWs, allWs] = await Promise.all([
          getActiveWorkspace(res.user.id),
          getUserWorkspaces(res.user.id),
        ]);
        setActiveWorkspaceState(activeWs || null);
        setUserWorkspaces(allWs);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    },
    []
  );

  const handleSignup = useCallback(
    async (name: string, emailOrPhone: string, pin: string) => {
      const res = await signup(name, emailOrPhone, pin);
      if (res.success && res.user) {
        setCurrentUserState(res.user);
        const [activeWs, allWs] = await Promise.all([
          getActiveWorkspace(res.user.id),
          getUserWorkspaces(res.user.id),
        ]);
        setActiveWorkspaceState(activeWs || null);
        setUserWorkspaces(allWs);
        return { success: true };
      }
      return { success: false, message: res.message || 'Signup failed' };
    },
    []
  );

  const handleLogout = useCallback(async () => {
    await logout();
    setCurrentUserState(null);
    setActiveWorkspaceState(null);
    setUserWorkspaces([]);
  }, []);

  const handleCreateWorkspace = useCallback(
    async (storeName: string) => {
      if (!currentUser) return { success: false, message: 'Please log in first' };
      if (!storeName.trim()) return { success: false, message: 'Please enter store name' };

      const res = await createWorkspace(storeName, currentUser);
      if (res.success) {
        setActiveWorkspaceState(res.workspace);
        const allWs = await getUserWorkspaces(currentUser.id);
        setUserWorkspaces(allWs);
        return { success: true, workspace: res.workspace };
      }
      return { success: false, message: 'Failed to create store' };
    },
    [currentUser]
  );

  const handleJoinWorkspace = useCallback(
    async (code: string) => {
      if (!currentUser) return { success: false, message: 'Please log in first' };
      if (!code.trim()) return { success: false, message: 'Please enter store invite code' };

      const res = await joinWorkspaceByCode(code, currentUser);
      if (res.success && res.workspace) {
        setActiveWorkspaceState(res.workspace);
        const allWs = await getUserWorkspaces(currentUser.id);
        setUserWorkspaces(allWs);
        return { success: true, workspace: res.workspace };
      }
      return { success: false, message: res.message || 'Could not find store with that code' };
    },
    [currentUser]
  );

  const handleSwitchWorkspace = useCallback(
    async (workspace: Workspace) => {
      if (currentUser) {
        await setActiveWorkspace(currentUser.id, workspace);
        setActiveWorkspaceState(workspace);
      }
    },
    [currentUser]
  );

  const quickDemoLogin = useCallback(async (userKey: 'ramesh' | 'suresh') => {
    const target = userKey === 'ramesh' ? DEMO_USERS[0] : DEMO_USERS[1];
    const user = await demoLogin(target.id);
    setCurrentUserState(user);

    const [activeWs, allWs] = await Promise.all([
      getActiveWorkspace(user.id),
      getUserWorkspaces(user.id),
    ]);
    setActiveWorkspaceState(activeWs || DEFAULT_WORKSPACE);
    setUserWorkspaces(allWs.length > 0 ? allWs : [DEFAULT_WORKSPACE]);
  }, []);

  const value: AuthContextValue = {
    currentUser,
    activeWorkspace,
    userWorkspaces,
    isLoading,
    handleLogin,
    handleSignup,
    handleLogout,
    handleCreateWorkspace,
    handleJoinWorkspace,
    handleSwitchWorkspace,
    quickDemoLogin,
    refreshWorkspaces,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
