import { Platform } from 'react-native';
import { storage } from '@/utils/storage';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('storage utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  it('stores secure keys in SecureStore on native', async () => {
    await storage.setItem('accessToken', 'token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'token');
  });

  it('stores non-secure keys in AsyncStorage on native', async () => {
    await storage.setItem('user', '{"id":"1"}');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', '{"id":"1"}');
  });

  it('reads and removes secure and async keys on native', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('token');
    await storage.getItem('accessToken');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('accessToken');

    await storage.removeItem('accessToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');

    await storage.removeItem('user');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('swallows localStorage write failures on web', async () => {
    Platform.OS = 'web';
    // @ts-expect-error test shim
    global.localStorage = {
      setItem: jest.fn(() => {
        throw new Error('quota');
      }),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await storage.setItem('user', 'value');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('uses localStorage on web', async () => {
    Platform.OS = 'web';
    const store: Record<string, string> = {};
    // @ts-expect-error test shim
    global.localStorage = {
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      getItem: jest.fn((key: string) => store[key] ?? null),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
    };

    await storage.setItem('user', 'value');
    expect(global.localStorage.setItem).toHaveBeenCalledWith('user', 'value');
    await storage.getItem('user');
    expect(global.localStorage.getItem).toHaveBeenCalledWith('user');
    await storage.removeItem('user');
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('user');
  });
});
