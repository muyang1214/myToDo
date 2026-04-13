import { Stack, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function RootLayout() {
  const { checkSession, user, isLoading } = useAuthStore();

  // 检查用户会话
  useEffect(() => {
    checkSession();
  }, []);

  // 加载中，返回 null
  if (isLoading) {
    return null;
  }

  // 已登录，重定向到受保护路由
  if (user) {
    return <Redirect href="/protected" />;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: '登录' }} />
      <Stack.Screen name="register" options={{ title: '注册' }} />
      <Stack.Screen name="protected" options={{ headerShown: false }} />
    </Stack>
  );
}
