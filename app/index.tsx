import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

// 根路径入口：已登录 → Todo 页，未登录 → 登录页
export default function IndexScreen() {
  const { user } = useAuthStore();
  return <Redirect href={user ? '/protected' : '/login'} />;
}
