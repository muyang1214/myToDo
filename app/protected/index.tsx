import { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTodoStore } from '@/stores/todoStore';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/Card';
import { TodoItem } from '@/components/TodoItem';
import { isToday } from '@/utils/date';
import {
  colors,
  fontSize,
  fontSans,
  fontMono,
  spacing,
  radius,
  CONTENT_MAX_WIDTH,
} from '@/theme/tokens';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function HomeScreen() {
  const [inputValue, setInputValue] = useState('');
  const {
    todos,
    isLoading,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    loadTodos,
    subscribeToRealtime,
  } = useTodoStore();
  const { signOut } = useAuthStore();
  const router = useRouter();

  // 组件挂载时加载数据 + 订阅实时更新
  useEffect(() => {
    loadTodos();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe(); // 组件卸载时取消订阅，防止内存泄漏
  }, []);

  // 主页只展示「未完成」，已完成统一进归档页
  const pendingTodos = useMemo(() => todos.filter((t) => !t.isCompleted), [todos]);

  // 「今日完成」必须按本地时区判定，不能切 ISO 字符串（原因见 utils/date.ts 文件头）
  const todayDoneCount = useMemo(
    () => todos.filter((t) => t.isCompleted && t.completedAt && isToday(t.completedAt)).length,
    [todos],
  );

  const now = new Date();
  const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日 周${WEEKDAYS[now.getDay()]}`;

  const handleAddTodo = () => {
    const content = inputValue.trim();
    if (!content) return;
    addTodo(content);
    setInputValue('');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>MyToDo</Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="添加新待办..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTodo} activeOpacity={0.8}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{pendingTodos.length}</Text>
            <Text style={styles.statLabel}>待办</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statNumber, styles.statNumberAccent]}>{todayDoneCount}</Text>
            <Text style={styles.statLabel}>今日完成</Text>
          </View>
        </Card>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={pendingTodos}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TodoItem
                todo={item}
                onToggle={() => toggleTodo(item.id)}
                onDelete={() => deleteTodo(item.id)}
                onSave={(content) => updateTodo(item.id, content)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>还没有待办</Text>
                <Text style={styles.emptyHint}>在上面输入一条，按回车即可添加</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>退出登录</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontSans,
    letterSpacing: -0.5,
  },
  dateLabel: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontFamily: fontMono,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    fontFamily: fontSans,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.surface,
    fontSize: fontSize.xxl,
    fontWeight: '600',
    lineHeight: 28,
    includeFontPadding: false,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontMono,
  },
  statNumberAccent: {
    color: colors.primary,
  },
  statLabel: {
    marginTop: 2,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: fontSans,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.divider,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 56,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontFamily: fontSans,
  },
  emptyHint: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontFamily: fontSans,
  },
  signOutButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fontSans,
  },
});
