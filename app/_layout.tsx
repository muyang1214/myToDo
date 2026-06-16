import { Stack, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

const DEV_SKIP_AUTH = false;

export default function RootLayout() {
  const { checkSession, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!DEV_SKIP_AUTH) checkSession();
  }, []);

  // ========== 开发模式 ==========
  // 独立路径：只渲染 protected 屏 + 重定向，不干涉正常认证逻辑
  if (DEV_SKIP_AUTH) {
    return (
      <Stack>
        <Stack.Screen name="protected" options={{ headerShown: false }} />
        <Redirect href="/protected" />
      </Stack>
    );
  }

  // ========== 正常模式 ==========
  if (isLoading) return null;
  if (user) return <Redirect href="/protected" />;

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: '登录' }} />
      <Stack.Screen name="register" options={{ title: '注册' }} />
      <Stack.Screen name="protected" options={{ headerShown: false }} />
    </Stack>
  );
}
