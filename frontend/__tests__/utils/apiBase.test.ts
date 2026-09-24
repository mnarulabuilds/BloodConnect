import { Platform } from 'react-native';
import { resolveApiBaseUrl, resolveSocketBaseUrl } from '@/utils/apiBase';

describe('apiBase', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
    }
  });

  it('prefers EXPO_PUBLIC_API_BASE_URL when set', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://custom:5001/api';
    expect(resolveApiBaseUrl()).toBe('http://custom:5001/api');
    expect(resolveSocketBaseUrl()).toBe('http://custom:5001');
  });

  it('rewrites stale localhost:5000 to 5001', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:5000/api';
    expect(resolveApiBaseUrl()).toBe('http://localhost:5001/api');
  });

  it('uses window hostname on web when env is unset', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    Platform.OS = 'web';
    // @ts-expect-error test shim
    global.window = { location: { hostname: '192.168.0.10' } };
    expect(resolveApiBaseUrl()).toBe('http://192.168.0.10:5001/api');
  });
});
