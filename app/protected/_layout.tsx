import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
// 精确到单个字体族：从 '@expo/vector-icons' 整体引入会把 19 个字体全打进产物
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTodoStore } from '@/stores/todoStore';
import { colors, fontSans, fontSize } from '@/theme/tokens';

/**
 * 已登录区的布局：底部两个 Tab —— 待办（index）/ 归档（archive）。
 *
 * 为什么数据加载与实时订阅放在这一层，而不是各页面里：
 *  - 两个 tab 共享同一份订阅 → 切 tab 不会重连 WebSocket
 *  - 深链直接进 /protected/archive 时也有数据（不会因为主页没挂载而空白）
 *  - 只加载一次，避免来回切换时重复拉全量
 */
export default function ProtectedLayout() {
  // 用 selector 精准订阅：布局层不需要 todos 数据本身，
  // 只取这两个稳定函数，避免待办变动时连带重渲染整个 Tabs 容器
  const loadTodos = useTodoStore((s) => s.loadTodos);
  const subscribeToRealtime = useTodoStore((s) => s.subscribeToRealtime);

  useEffect(() => {
    loadTodos();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe(); // 离开已登录区时取消订阅，防内存泄漏
  }, []);

  return (
    <Tabs
      screenOptions={{
        // 页面自己画 header（主页有日期副标题，Tabs header 塞不进去）
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '待办',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: '归档',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="archive-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    // 不设固定 height：交给 React Navigation 自己算（含 iOS 安全区）
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontSans,
  },
});
