import { Stack, Redirect, Slot, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

const DEV_SKIP_AUTH = false;

export default function RootLayout() {
  const { checkSession, user, isLoading } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!DEV_SKIP_AUTH) checkSession();
  }, []);

  if (isLoading) return <Slot />;

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: '登录' }} />
      <Stack.Screen name="register" options={{ title: '注册' }} />
      <Stack.Screen name="protected" options={{ headerShown: false }} />

      {/* 正向：已登录 + 不在 /protected → 带进去 */}
      {user && pathname !== '/protected' && <Redirect href="/protected" />}

      {/* 反向：未登录 + 在 /protected → 赶出去 */}
      {!user && pathname === '/protected' && <Redirect href="/login" />}
    </Stack>
  );
}
