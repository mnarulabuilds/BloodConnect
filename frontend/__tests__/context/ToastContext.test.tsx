import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ToastProvider, useToast, useToastState } from '@/context/ToastContext';

describe('ToastContext', () => {
  it('throws outside provider', () => {
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/);
  });

  it('auto hides after duration', () => {
    jest.useFakeTimers();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Auto hide', duration: 500 });
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current.toast.visible).toBe(false);
    jest.useRealTimers();
  });

  it('exposes toast state via useToastState', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    const { result } = renderHook(() => useToastState(), { wrapper });
    expect(result.current?.toast.visible).toBe(false);
  });

  it('useToastState returns undefined outside provider', () => {
    const { result } = renderHook(() => useToastState());
    expect(result.current).toBeUndefined();
  });

  it('replaces an existing toast timer when showing again', () => {
    jest.useFakeTimers();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'First', type: 'info', duration: 2000 });
      result.current.showToast({ message: 'Second', type: 'error', duration: 1000 });
    });
    expect(result.current.toast.message).toBe('Second');
    expect(result.current.toast.type).toBe('error');
    jest.useRealTimers();
  });

  it('shows and hides toast', () => {
    jest.useFakeTimers();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Saved', type: 'success', duration: 1000 });
    });
    expect(result.current.toast.visible).toBe(true);
    expect(result.current.toast.message).toBe('Saved');

    act(() => {
      result.current.hideToast();
    });
    expect(result.current.toast.visible).toBe(false);
    jest.useRealTimers();
  });
});
