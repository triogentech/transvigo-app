import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth.store';
import { initOfflineListener } from '@/store/offline.store';
import { useNotifications } from '@/hooks/useNotifications';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Toaster } from '@/components/ui/Toaster';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useColors, useResolvedScheme } from '@/theme';

/** Redirects between the (auth) and (tabs) groups based on auth state. */
/** Non-driver roles (Operations / Staff / Admin) get the Ops experience. */
function isOpsRole(role: string | undefined): boolean {
  return !!role && role !== 'Driver';
}

function useAuthGate(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const role = useAuthStore((s) => s.user?.role);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const seg = segments as string[];
    const inAuthGroup = seg[0] === '(auth)';
    const onChangePassword = seg[1] === 'change-password';
    const ops = isOpsRole(role);
    const home = ops ? '/(ops)' : '/(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && !onChangePassword) {
      router.replace(home);
    } else if (isAuthenticated && !inAuthGroup) {
      // Keep each role in its own group (driver tabs vs ops tabs).
      if (ops && seg[0] === '(tabs)') router.replace('/(ops)');
      else if (!ops && seg[0] === '(ops)') router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, role, segments, router]);
}

function AppShell() {
  const c = useColors();
  const scheme = useResolvedScheme();
  const isLoading = useAuthStore((s) => s.isLoading);
  useAuthGate();
  useNotifications();

  return (
    <View style={{ flex: 1, backgroundColor: c.bgPage }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }} />
      <Toaster />
      <LoadingOverlay visible={isLoading} />
    </View>
  );
}

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    void initAuth();
    const unsub = initOfflineListener();
    return () => unsub();
  }, [initAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
