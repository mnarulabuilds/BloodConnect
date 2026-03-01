import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import type {
  LoginCredentials,
  RegisterData,
  CreateRequestData,
  RequestFilterParams,
  DonorFilterParams,
  PaginationParams,
} from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      const networkError = new Error('Network error. Please check your connection.');
      (networkError as any).isNetworkError = true;
      return Promise.reject(networkError);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        await storage.setItem('accessToken', data.accessToken);
        await storage.setItem('refreshToken', data.refreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await storage.removeItem('accessToken');
        await storage.removeItem('refreshToken');
        await storage.removeItem('user');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials: LoginCredentials) => api.post('/auth/login', credentials),
  register: (userData: RegisterData) => api.post('/auth/register', userData),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};

export const userService = {
  updateProfile: (userData: Record<string, unknown>) => api.put('/users/profile', userData),
};

export const donorService = {
  getDonors: (params?: DonorFilterParams) =>
    api.get('/donors', { params: { ...params } }),
  getStats: () => api.get('/donors/stats'),
};

export const requestService = {
  getRequests: () => api.get('/requests', { params: { limit: 3 } }),
  getRequestsPaginated: (params: RequestFilterParams) => api.get('/requests', { params }),
  createRequest: (requestData: CreateRequestData) => api.post('/requests', requestData),
  updateRequest: (id: string, requestData: Record<string, unknown>) => api.put(`/requests/${id}`, requestData),
  deleteRequest: (id: string) => api.delete(`/requests/${id}`),
};

export const chatService = {
  getChats: (params?: PaginationParams) => api.get('/chats', { params }),
  getChatById: (chatId: string) => api.get(`/chats/${chatId}`),
  startChat: (recipientId: string, bloodRequestId?: string) =>
    api.post('/chats', { recipientId, bloodRequestId }),
  getMessages: (chatId: string, params?: PaginationParams) =>
    api.get(`/chats/${chatId}/messages`, { params }),
  sendMessage: (chatId: string, text: string) =>
    api.post(`/chats/${chatId}/messages`, { text }),
};

export const notificationService = {
  registerToken: (token: string, platform: string) =>
    api.post('/notifications/register-token', { token, platform }),
  unregisterToken: (token: string) =>
    api.delete('/notifications/unregister-token', { data: { token } }),
};

export default api;
