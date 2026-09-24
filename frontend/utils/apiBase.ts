import { Platform } from 'react-native';

/** Host port for Docker dev (`5001:5000`). macOS often occupies 5000 (AirPlay). */
export const DEV_API_PORT = '5001';

const DEFAULT_API = `http://localhost:${DEV_API_PORT}/api`;
const DEFAULT_HOST = `http://localhost:${DEV_API_PORT}`;

/** Stale configs pointed at :5000; that port is usually not the BloodConnect API on macOS. */
function normalizeLocalApiPort(url: string): string {
  return url.replace(/:(5000)(?=\/api)/, `:${DEV_API_PORT}`).replace(/:(5000)$/, `:${DEV_API_PORT}`);
}

/**
 * Resolves API base URL for web and native.
 * On web, when no env is set, uses the same hostname as the page (fixes LAN / Docker dev).
 */
export function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return normalizeLocalApiPort(process.env.EXPO_PUBLIC_API_BASE_URL);
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:${DEV_API_PORT}/api`;
  }
  return DEFAULT_API;
}

export function resolveSocketBaseUrl(): string {
  return resolveApiBaseUrl().replace(/\/api\/?$/, '') || DEFAULT_HOST;
}
