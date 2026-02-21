import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    async setItem(key: string, value: string) {
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.error('localStorage failed', e);
            }
        } else {
            // SecureStore has a size limit (usually 2KB on iOS).
            // We only use it for the token.
            if (key === 'userToken') {
                await SecureStore.setItemAsync(key, value);
            } else {
                // For the User object (which can contain base64), use AsyncStorage.
                await AsyncStorage.setItem(key, value);
            }
        }
    },
    async getItem(key: string) {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        } else {
            if (key === 'userToken') {
                return await SecureStore.getItemAsync(key);
            } else {
                return await AsyncStorage.getItem(key);
            }
        }
    },
    async removeItem(key: string) {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            if (key === 'userToken') {
                await SecureStore.deleteItemAsync(key);
            } else {
                await AsyncStorage.removeItem(key);
            }
        }
    }
};
