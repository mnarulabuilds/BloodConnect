import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { authService, userService } from '@/utils/api';
import { storage } from '@/utils/storage';

jest.mock('@/utils/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
  userService: {
    updateProfile: jest.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads stored session on mount', async () => {
    jest.spyOn(storage, 'getItem').mockImplementation(async (key) => {
      if (key === 'accessToken') return 'token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'User' });
      return null;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.token).toBe('token');
    expect(result.current.user?.name).toBe('User');
  });

  it('logs in and persists tokens', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      data: {
        accessToken: 'a',
        refreshToken: 'r',
        user: { id: '1', name: 'User' },
      },
    });
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);
    const setItem = jest.spyOn(storage, 'setItem').mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('user@example.com', 'Password1');
    });

    expect(setItem).toHaveBeenCalled();
    expect(result.current.user?.name).toBe('User');
  });

  it('handles corrupted storage gracefully', async () => {
    jest.spyOn(storage, 'getItem').mockRejectedValue(new Error('storage broken'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('rejects invalid register response', async () => {
    (authService.register as jest.Mock).mockResolvedValue({ data: {} });
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      result.current.register({
        name: 'New',
        email: 'new@example.com',
        password: 'Password1',
        phone: '1234567890',
        location: 'Delhi',
        bloodGroup: 'A+',
      })
    ).rejects.toThrow('Invalid response');
  });

  it('surfaces login errors', async () => {
    (authService.login as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.login('bad@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('registers user and stores session', async () => {
    (authService.register as jest.Mock).mockResolvedValue({
      data: { accessToken: 'a', refreshToken: 'r', user: { id: '2', name: 'New' } },
    });
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);
    jest.spyOn(storage, 'setItem').mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.register({
        name: 'New',
        email: 'new@example.com',
        password: 'Password1',
        phone: '1234567890',
        location: 'Delhi',
        bloodGroup: 'A+',
      });
    });

    expect(result.current.user?.name).toBe('New');
  });

  it('surfaces profile update errors', async () => {
    (userService.updateProfile as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Update failed' } },
    });
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.updateUser({ name: 'Bad' })).rejects.toThrow('Update failed');
  });

  it('updates profile and clears session on logout', async () => {
    (userService.updateProfile as jest.Mock).mockResolvedValue({
      data: { data: { id: '1', name: 'Updated' } },
    });
    (authService.logout as jest.Mock).mockResolvedValue({});
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);
    jest.spyOn(storage, 'setItem').mockResolvedValue();
    jest.spyOn(storage, 'removeItem').mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateUser({ name: 'Updated' });
    });
    expect(result.current.user?.name).toBe('Updated');

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();
  });

  it('still clears local session if logout request fails', async () => {
    (authService.logout as jest.Mock).mockRejectedValue(new Error('network'));
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);
    jest.spyOn(storage, 'removeItem').mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it('throws when hook used outside provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});
