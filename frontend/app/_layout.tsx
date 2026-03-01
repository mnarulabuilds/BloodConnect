import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ChatProvider } from '@/context/ChatContext';
import Toast from '@/components/Toast';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '@/utils/notifications';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    enabled: __DEV__ === false,
  });
}

export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  useEffect(() => {
    if (!user) return;

    registerForPushNotifications().then((token) => {
      pushTokenRef.current = token;
    });

    const responseSub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.requestId) {
        router.push('/all-requests');
      }
    });

    const receivedSub = addNotificationReceivedListener(() => {});

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, [user]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="request-blood"
          options={{ presentation: 'modal', title: 'Create Blood Request', headerShown: true }}
        />
        <Stack.Screen name="all-requests" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <Toast />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ChatProvider>
          <RootLayoutNav />
        </ChatProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
