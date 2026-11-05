import { useMemo, useState } from 'react';
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
import { useTodoStore } from '@/stores/todoStore';
import { TodoItem } from '@/components/TodoItem';
import { TodayDoneCard } from '@/components/TodayDoneCard';
import { useTodayKey } from '@/hooks/useTodayKey';
import { isToday } from '@/utils/date';
import { Todo } from '@/types';
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

/**
 * 待办主页：只展示未完成事项 + 今日战果卡。
 *
 * 数据加载与实时订阅已上移到 app/protected/_layout.tsx（Tabs 层），
 * 这里只负责渲染与交互。
 */
export default function HomeScreen() {
  const [inputValue, setInputValue] = useState('');

  // 跨天自动刷新的「今天」键（含 AppState / Web visibilitychange 三重触发）
  const todayKey = useTodayKey();

  const {
    todos,
    isLoading,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
  } = useTodoStore();

  // 参考「此刻」，todayKey 变化时重算，保证跨天后「今天完成」是准的
  const referenceNow = useMemo(() => new Date(), [todayKey]);

  // 主页只展示「未完成」，已完成统一进今日战果卡 + 归档页
  const pendingTodos = useMemo(() => todos.filter((t) => !t.isCompleted), [todos]);

  // 今日完成：按本地时区判定（见 utils/date.ts 文件头），按完成时间倒序
  const todayDone = useMemo(
    () =>
      todos
        .filter(
          (t): t is Todo & { completedAt: Date } =>
            t.isCompleted && t.completedAt != null && isToday(t.completedAt, referenceNow),
        )
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()),
    [todos, referenceNow],
  );

  const dateLabel = `${referenceNow.getMonth() + 1}月${referenceNow.getDate()}日 周${
    WEEKDAYS[referenceNow.getDay()]
  }`;

  const handleAddTodo = () => {
    const content = inputValue.trim();
    if (!content) return;
    addTodo(content);
    setInputValue('');
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

        <TodayDoneCard items={todayDone} onUndo={(id) => toggleTodo(id)} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>待办</Text>
          <Text style={styles.sectionCount}>{pendingTodos.length}</Text>
        </View>

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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: fontSans,
  },
  sectionCount: {
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: fontMono,
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
});
