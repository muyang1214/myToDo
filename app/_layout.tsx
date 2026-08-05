import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

const DEV_SKIP_AUTH = false;
// GitHub Pages 部署子目录 —— expo-router 不支持原生 baseUrl，
// 需要在客户端手动剥离前缀再 redirect
const BASE_PATH = '/myToDo';

export default function RootLayout() {
  const { checkSession, user, isLoading } = useAuthStore();
  const router = useRouter();
  const prevUser = useRef(user);

  // 剥离 GitHub Pages 子目录前缀，让 expo-router 能正确匹配路由
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;
    if (pathname.startsWith(BASE_PATH)) {
      const stripped = pathname.slice(BASE_PATH.length) || '/';
      // replaceState 保持浏览器 URL 不变（避免刷新时 404），
      // 同时让 expo-router 的 location.pathname 返回新路径
      router.replace(stripped + window.location.search);
    }
  }, []);

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
