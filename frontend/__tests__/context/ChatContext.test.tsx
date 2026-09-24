import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { io } from 'socket.io-client';

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ChatContext', () => {
  it('throws outside provider', () => {
    expect(() => renderHook(() => useChat())).toThrow(/ChatProvider/);
  });

  it('connects socket when token exists', async () => {
    const socket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
    };
    (io as jest.Mock).mockReturnValue(socket);
    (useAuth as jest.Mock).mockReturnValue({ token: 'token', user: { id: '1' } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.socket).toBeTruthy());

    act(() => {
      result.current.joinChat('chat-1');
    });

    expect(socket.emit).toHaveBeenCalledWith('join_chat', 'chat-1');
  });

  it('disconnects when token is cleared', async () => {
    const socket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
    };
    (io as jest.Mock).mockReturnValue(socket);

    const authState = { token: 'token', user: { id: '1' } };
    (useAuth as jest.Mock).mockImplementation(() => authState);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result, rerender } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.socket).toBeTruthy());

    authState.token = null;
    rerender({});
    await waitFor(() => expect(socket.disconnect).toHaveBeenCalled());
  });

  it('queues joinChat until socket connects', async () => {
    const handlers: Record<string, () => void> = {};
    const socket = {
      on: jest.fn((event: string, cb: () => void) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    };
    (io as jest.Mock).mockReturnValue(socket);
    (useAuth as jest.Mock).mockReturnValue({ token: 'token', user: { id: '1' } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.socket).toBeTruthy());

    act(() => {
      result.current.joinChat('chat-pending');
    });
    expect(socket.emit).not.toHaveBeenCalled();

    socket.connected = true;
    act(() => {
      handlers.connect?.();
    });
    expect(socket.emit).toHaveBeenCalledWith('join_chat', 'chat-pending');
  });

  it('rejoins active chat on connect event', async () => {
    const handlers: Record<string, () => void> = {};
    const socket = {
      on: jest.fn((event: string, cb: () => void) => {
        handlers[event] = cb;
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
    };
    (io as jest.Mock).mockReturnValue(socket);
    (useAuth as jest.Mock).mockReturnValue({ token: 'token', user: { id: '1' } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatProvider>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });
    await waitFor(() => expect(result.current.socket).toBeTruthy());

    act(() => {
      result.current.joinChat('chat-2');
    });

    act(() => {
      handlers.connect?.();
    });

    expect(socket.emit).toHaveBeenCalledWith('join_chat', 'chat-2');
  });
});
