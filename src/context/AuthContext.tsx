import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, WalletBalance, NotificationItem, KYCRecord } from '../types/index';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  balances: { USDT: WalletBalance; USDC: WalletBalance } | null;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  kycRecord: KYCRecord | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phoneNumber?: string; referralCode?: string }) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  logout: () => void;
  quickLogin: (type: 'user' | 'admin' | 'newuser') => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cryptic_token');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [balances, setBalances] = useState<{ USDT: WalletBalance; USDC: WalletBalance } | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [kycRecord, setKycRecord] = useState<KYCRecord | null>(null);

  const saveToken = (newToken: string | null) => {
    setToken(newToken);
    try {
      if (newToken) {
        localStorage.setItem('cryptic_token', newToken);
      } else {
        localStorage.removeItem('cryptic_token');
      }
    } catch {
      // ignore
    }
  };

  const refreshBalances = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getBalances();
      if (res.success) {
        setBalances(res.balances);
      }
    } catch (err) {
      console.warn('Could not fetch balances:', err);
    }
  }, [token]);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  }, [token]);

  const refreshKYC = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.getKYCStatus();
      if (res.success) {
        setKycRecord(res.record);
      }
    } catch (err) {
      console.warn('Could not fetch KYC record:', err);
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        await Promise.allSettled([refreshBalances(), refreshNotifications(), refreshKYC()]);
      } else {
        saveToken(null);
        setUser(null);
      }
    } catch {
      saveToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, refreshBalances, refreshNotifications, refreshKYC]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      saveToken(res.token);
      setUser(res.user);
      await Promise.allSettled([refreshBalances(), refreshNotifications(), refreshKYC()]);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; fullName?: string; phoneNumber?: string; referralCode?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      if (!res?.token || !res?.user) {
        throw new Error(res?.error || 'Registration failed. Please try again.');
      }
      saveToken(res.token);
      setUser(res.user);
      // Immediately initialize safe default balances for the new user
      setBalances({
        USDT: { asset: 'USDT', available: 0, locked: 0, pending: 0 },
        USDC: { asset: 'USDC', available: 0, locked: 0, pending: 0 },
      });
      // Trigger background refreshes
      api.getBalances().then((b) => b?.success && setBalances(b.balances)).catch(() => {});
      api.getNotifications().then((n) => n?.success && setNotifications(n.notifications)).catch(() => {});
      api.getKYCStatus().then((k) => k?.success && setKycRecord(k.record)).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const res = await api.resetPassword({ email, newPassword });
      if (!res?.token || !res?.user) {
        throw new Error(res?.error || 'Password reset failed.');
      }
      saveToken(res.token);
      setUser(res.user);
      await Promise.allSettled([refreshBalances(), refreshNotifications(), refreshKYC()]);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    saveToken(null);
    setUser(null);
    setBalances(null);
    setNotifications([]);
    setKycRecord(null);
  };

  const quickLogin = async (type: 'user' | 'admin' | 'newuser') => {
    if (type === 'admin') {
      await login('admin@cryptic.io', 'AdminPass123!');
    } else if (type === 'user') {
      await login('demo@cryptic.io', 'DemoPass123!');
    } else {
      await login('newuser@cryptic.io', 'UserPass123!');
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        balances,
        notifications,
        unreadNotificationCount,
        kycRecord,
        login,
        register,
        resetPassword,
        logout,
        quickLogin,
        refreshUser,
        refreshBalances,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
