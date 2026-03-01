import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService, userService } from '../utils/api';
import type { User, RegisterData } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStoredData = async () => {
      try {
        const storedToken = await storage.getItem('accessToken');
        const storedUser = await storage.getItem('user');

        if (!cancelled && storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadStoredData();
    return () => { cancelled = true; };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      await storage.setItem('accessToken', accessToken);
      await storage.setItem('refreshToken', refreshToken);
      await storage.setItem('user', JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      throw new Error(err.response?.data?.error || err.message || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authService.register(userData);
      const { accessToken, refreshToken, user: newUser } = response.data;

      if (!accessToken || !newUser) {
        throw new Error('Invalid response from server');
      }

      await storage.setItem('accessToken', String(accessToken));
      await storage.setItem('refreshToken', String(refreshToken));
      await storage.setItem('user', JSON.stringify(newUser));

      setToken(accessToken);
      setUser(newUser);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      throw new Error(err.response?.data?.error || err.message || 'Registration failed');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await userService.updateProfile(userData as Record<string, unknown>);
      const updatedUser = response.data.data;

      await storage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      throw new Error(err.response?.data?.error || err.message || 'Update failed');
    }
  };

  const logout = async () => {
    try {
      await authService.logout().catch(() => {});
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
      await storage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
