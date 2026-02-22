import axios from 'axios';
import { storage } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await storage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth Services
export const authService = {
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (userData: any) => api.post('/auth/register', userData),
};

// User Services
export const userService = {
    getProfile: () => api.get('/users/me'),
    updateProfile: (userData: any) => api.put('/users/profile', userData),
};

// Donor Services
export const donorService = {
    getDonors: (params: any) => api.get('/donors', { params: { role: 'donor', isAvailable: true, ...params } }),
    getStats: () => api.get('/donors/stats'),
};

// Request Services
export const requestService = {
    getRequests: () => api.get('/requests', { params: { limit: 3 } }),
    getRequestsPaginated: (params: { page?: number; limit?: number; bloodGroup?: string; urgency?: string; status?: string }) =>
        api.get('/requests', { params }),
    createRequest: (requestData: any) => api.post('/requests', requestData),
    updateRequest: (id: string, requestData: any) => api.put(`/requests/${id}`, requestData),
    deleteRequest: (id: string) => api.delete(`/requests/${id}`),
};

export const chatService = {
    getChats: () => api.get('/chats'),
    startChat: (recipientId: string, bloodRequestId?: string) => api.post('/chats', { recipientId, bloodRequestId }),
    getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),
    sendMessage: (chatId: string, text: string) => api.post(`/chats/${chatId}/messages`, { text }),
}

export default api;
