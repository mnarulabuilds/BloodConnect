import { Platform } from 'react-native';

const DEFAULT_API = 'http://localhost:5001/api';
const DEFAULT_HOST = 'http://localhost:5001';

/**
 * Resolves API base URL for web and native.
 * On web, when no env is set, uses the same hostname as the page (fixes LAN / Docker dev).
 */
export function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5001/api`;
  }
  return DEFAULT_API;
}

export function resolveSocketBaseUrl(): string {
  return resolveApiBaseUrl().replace(/\/api\/?$/, '') || DEFAULT_HOST;
}
