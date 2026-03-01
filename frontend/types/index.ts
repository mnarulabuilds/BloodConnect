export interface User {
  id: string;
  name: string;
  email: string;
  bloodGroup?: string;
  role: 'donor' | 'hospital' | 'admin';
  phone?: string;
  location?: string;
  avatar?: string;
  isAvailable?: boolean;
  lastDonationDate?: string;
  nextEligibleDate?: string;
  isMedicalHistoryClear?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    count: number;
  };
}

export interface BloodRequest {
  _id: string;
  patientName: string;
  bloodGroup: string;
  hospital: string;
  location: string;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  units: number;
  contact: string;
  status: 'open' | 'completed' | 'cancelled';
  requestor: { _id?: string; name?: string; phone?: string } | string;
  donor?: string;
  createdAt: string;
}

export interface Chat {
  _id: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  bloodRequestId?: string;
  status: 'active' | 'archived';
  updatedAt: string;
  createdAt: string;
}

export interface ChatParticipant {
  _id: string;
  name: string;
  bloodGroup?: string;
  avatar?: string;
  role: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface Donor {
  _id: string;
  id: string;
  name: string;
  bloodGroup: string;
  location: string;
  phone: string;
  isAvailable: boolean;
  role: string;
  avatar?: string;
  coordinates?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface DonorStats {
  totalDonors: number;
  totalSaved: number;
  groupStats: { group: string; count: number }[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  bloodGroup?: string;
  role?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateRequestData {
  patientName?: string;
  bloodGroup: string;
  hospital?: string;
  location: string;
  units?: number;
  urgency?: string;
  contact: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface RequestFilterParams extends PaginationParams {
  bloodGroup?: string;
  urgency?: string;
  status?: string;
}

export interface DonorFilterParams extends PaginationParams {
  bloodGroup?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}
