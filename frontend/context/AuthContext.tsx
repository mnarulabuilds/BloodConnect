import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService, userService } from '../utils/api';

interface User {
    id: string;
    name: string;
    email: string;
    bloodGroup?: string;
    role: string;
    phone?: string;
    location?: string;
    avatar?: string;
    isAvailable?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    updateUser: (userData: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredData();
    }, []);

    const loadStoredData = async () => {
        try {
            const storedToken = await storage.getItem('userToken');
            const storedUser = await storage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Failed to load auth data', e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });
            const { token, user } = response.data;

            await storage.setItem('userToken', token);
            await storage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);
        } catch (e: any) {
            throw new Error(e.response?.data?.error || 'Login failed');
        }
    };

    const register = async (userData: any) => {
        try {
            const response = await authService.register(userData);
            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            await storage.setItem('userToken', String(token));
            await storage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);
        } catch (e: any) {
            throw new Error(e.response?.data?.error || e.message || 'Registration failed');
        }
    };

    const updateUser = async (userData: Partial<User>) => {
        try {
            const response = await userService.updateProfile(userData);
            const updatedUser = response.data.data;

            await storage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (e: any) {
            throw new Error(e.response?.data?.error || 'Update failed');
        }
    };

    const logout = async () => {
        try {
            await storage.removeItem('userToken');
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
