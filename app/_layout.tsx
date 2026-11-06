import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

const DEV_SKIP_AUTH = false;

// ---------------------------------------------------------------------------
// 子目录部署（GitHub Pages /myToDo/）的前缀处理全部在 index.html 的内联脚本里完成，
// 见 scripts/inject-base-path.js。这里不再做任何 URL 改写，原因：
//
//   1. 剥离前缀必须早于 expo-router 首次匹配路由，只有 <head> 内联脚本够早；
//   2. 补回前缀若放在 React effect 里，会被 expo-router 内部的 history.replaceState
//      覆盖回去（它执行得更晚），两边抢地址栏必然出问题。
//      因此改在源头包一层 history.pushState/replaceState，统一加前缀。
//
// 本地开发（npm run web）和 Vercel 部署在根路径，没有注入脚本，此机制自然不生效。
// ---------------------------------------------------------------------------

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
