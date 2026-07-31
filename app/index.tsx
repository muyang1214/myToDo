import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function IndexScreen() {
  const { user } = useAuthStore();
  if (user) return <Redirect href="/protected" />;
  return <Redirect href="/login" />;
}
