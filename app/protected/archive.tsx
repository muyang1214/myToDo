import { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTodoStore } from '@/stores/todoStore';
import { useAuthStore } from '@/stores/authStore';
import { TodoItem } from '@/components/TodoItem';
import { useTodayKey } from '@/hooks/useTodayKey';
import { groupByLocalDate, DateSection } from '@/utils/date';
import { Todo } from '@/types';
import {
  colors,
  fontSize,
  fontSans,
  fontMono,
  spacing,
  CONTENT_MAX_WIDTH,
} from '@/theme/tokens';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 由 YYYY-MM-DD 键取星期。
 *
 * 注意：不能写 new Date('2026-09-27') —— 该形式会被当成 UTC 零点解析，
 * 在西半球时区会掉回前一天，星期就算错了。
 * 必须手动拆出年月日，用本地时间构造。
 */
function weekdayOf(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  return ` 周${WEEKDAYS[new Date(year, month - 1, day).getDay()]}`;
}

/**
 * 归档页：已完成待办按「本地完成日」分组回顾。
 *
 * 交互约定：
 *  - 条目只读（不传 onSave → TodoItem 自动退化为不可编辑）
 *  - 点勾 = 撤销完成，该条退回待办列表（不传 onDelete，归档页不提供删除）
 *  - 退出登录放在底部（低频操作，不占主页）
 */
export default function ArchiveScreen() {
  const todayKey = useTodayKey();
  const router = useRouter();

  const todos = useTodoStore((s) => s.todos);
  const isLoading = useTodoStore((s) => s.isLoading);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const { signOut } = useAuthStore();

  const referenceNow = useMemo(() => new Date(), [todayKey]);

  // 只取已完成，按本地完成日分组（completedAt 为 null 的脏数据会被自动过滤）
  const sections = useMemo(
    () =>
      groupByLocalDate(
        todos.filter((t) => t.isCompleted),
        (t) => t.completedAt,
        referenceNow,
      ),
    [todos, referenceNow],
  );

  const total = useMemo(() => sections.reduce((sum, s) => sum + s.data.length, 0), [sections]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const renderSectionHeader = ({ section }: { section: DateSection<Todo> }) => {
    // 「今天 / 昨天」本身就是相对说法，不必再挂星期
    const isRelative = section.label === '今天' || section.label === '昨天';
    const label = isRelative ? section.label : section.label + weekdayOf(section.key);

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>归档</Text>
          <Text style={styles.subtitle}>
            {total > 0 ? `共 ${total} 条已完成` : '已完成的事项会收在这里'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={renderSectionHeader}
            renderItem={({ item }) => (
              // 不传 onSave → 只读；onToggle 只传 id，撤销后该条退回待办页
              <TodoItem todo={item} onToggle={() => toggleTodo(item.id)} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>还没有已完成的事项</Text>
                <Text style={styles.emptyHint}>在待办页点击圆圈完成一条，这里就会出现</Text>
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>退出登录</Text>
              </TouchableOpacity>
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
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fontSans,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontFamily: fontSans,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fontSans,
  },
  sectionCount: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontFamily: fontMono,
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
    marginTop: spacing.xxxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: fontSans,
  },
});
