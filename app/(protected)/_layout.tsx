import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedLayout() {
  const { checkSession, user } = useAuthStore();

  // 检查用户会话
  useEffect(() => {
    checkSession();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'MyToDo' }} />
    </Stack>
  );
}
