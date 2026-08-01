import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

const DEV_SKIP_AUTH = false;

export default function RootLayout() {
  const { checkSession, user, isLoading } = useAuthStore();
  const router = useRouter();
  const prevUser = useRef(user);

  // 启动时检查会话
  useEffect(() => {
    if (!DEV_SKIP_AUTH) checkSession();
  }, []);

  // 用户状态变化时导航——用 useEffect + router 而不是 <Redirect>
  // 因为 <Redirect> 在 Slot→Stack 切换的生产构建中不可靠
  useEffect(() => {
    if (DEV_SKIP_AUTH) {
      router.replace('/protected');
      return;
    }
    if (isLoading) return;
    if (user === prevUser.current) return;

    prevUser.current = user;
    router.replace(user ? '/protected' : '/login');
  }, [isLoading, user]);

  // Stack 始终渲染，从不切换——这是稳定性的关键
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: '登录' }} />
      <Stack.Screen name="register" options={{ title: '注册' }} />
      <Stack.Screen name="protected" options={{ headerShown: false }} />
    </Stack>
  );
}
