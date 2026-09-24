import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { authService, setSessionExpiredHandler, userService } from '@/utils/api';
import { storage } from '@/utils/storage';

jest.mock('@/utils/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
  },
  userService: {
    updateProfile: jest.fn(),
  },
  setSessionExpiredHandler: jest.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restores session via refresh token on mount', async () => {
    jest.spyOn(storage, 'getItem').mockImplementation(async (key) => {
      if (key === 'refreshToken') return 'refresh';
      return null;
    });
    (authService.refresh as jest.Mock).mockResolvedValue({
      data: {
        accessToken: 'token',
        refreshToken: 'refresh-new',
        user: { id: '1', name: 'User' },
      },
    });
    const setItem = jest.spyOn(storage, 'setItem').mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(authService.refresh).toHaveBeenCalledWith('refresh');
    expect(setItem).toHaveBeenCalled();
    expect(result.current.token).toBe('token');
    expect(result.current.user?.name).toBe('User');
  });

  it('ignores cleanup errors for stale session without refresh token', async () => {
    jest.spyOn(storage, 'getItem').mockImplementation(async (key) => {
      if (key === 'accessToken') return 'old-token';
      return null;
    });
    jest.spyOn(storage, 'removeItem').mockRejectedValue(new Error('remove failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('clears stale tokens when refresh token is missing', async () => {
    jest.spyOn(storage, 'getItem').mockImplementation(async (key) => {
      if (key === 'accessToken') return 'old-token';
      if (key === 'user') return JSON.stringify({ id: '1', name: 'Stale' });
      return null;
    });
    const removeItem = jest.spyOn(storage, 'removeItem').mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(removeItem).toHaveBeenCalledWith('accessToken');
    expect(removeItem).toHaveBeenCalledWith('user');
    expect(result.current.user).toBeNull();
  });

  it('invokes session expired handler registered with api client', async () => {
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);
    jest.spyOn(storage, 'setItem').mockResolvedValue();
    (authService.login as jest.Mock).mockResolvedValue({
      data: {
        accessToken: 'a',
        refreshToken: 'r',
        user: { id: '1', name: 'User' },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const handler = (setSessionExpiredHandler as jest.Mock).mock.calls.at(-1)?.[0];
    expect(typeof handler).toBe('function');

    await act(async () => {
      await result.current.login('user@example.com', 'Password1');
    });
    expect(result.current.user).toBeTruthy();

    act(() => {
      handler();
    });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('clears session when refresh fails on mount', async () => {
    jest.spyOn(storage, 'getItem').mockImplementation(async (key) => {
      if (key === 'refreshToken') return 'stale';
      return null;
    });
    (authService.refresh as jest.Mock).mockRejectedValue(new Error('expired'));
    const removeItem = jest.spyOn(storage, 'removeItem').mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(removeItem).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('clears auth state when refresh and storage cleanup both fail', async () => {
    jest.spyOn(storage, 'getItem').mockImplementation(async (key) => {
      if (key === 'refreshToken') return 'stale';
      return null;
    });
    (authService.refresh as jest.Mock).mockRejectedValue(new Error('expired'));
    jest.spyOn(storage, 'removeItem').mockRejectedValue(new Error('remove failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
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

  it('logs when logout cleanup throws unexpectedly', async () => {
    (authService.logout as jest.Mock).mockResolvedValue({});
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);
    jest.spyOn(storage, 'removeItem').mockRejectedValue(new Error('remove failed'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
