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
import { categorizeTodo, categoryColor, categoryLabel } from '@/utils/category';
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
 * 首页的两个视角：工作 / 非工作。
 * 工作 = category 为 work；非工作 = 运动 / 投资 / 生活 / 未分类（即 work 之外的一切）。
 */
type TodoScope = 'work' | 'other';

const SCOPE_LABEL: Record<TodoScope, string> = {
  work: '工作',
  other: '非工作',
};

/**
 * 待办主页：只展示未完成事项 + 今日战果卡。
 *
 * 数据加载与实时订阅已上移到 app/protected/_layout.tsx（Tabs 层），
 * 这里只负责渲染与交互。
 */
export default function HomeScreen() {
  const [inputValue, setInputValue] = useState('');

  // 视角切换：默认「工作」，刻意不持久化。
  // 你的作息自带「一天起点」（早上到公司冷启动），默认工作等于替你提前做了早上那次点击；
  // 晚上回家切到非工作是一次主动操作，第二天冷启动又自动回到工作，正好对齐。
  // 若记住上次选择，反而会出现「早上打开还是昨晚的非工作、还得点回来」。
  const [scope, setScope] = useState<TodoScope>('work');

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

  // 按视角分档。category 由 mapRowToTodo 按内容实时算出，改词表即刻全局生效，
  // 因此这里不依赖库里存的旧快照，历史待办也能正确落档。
  const scopedPending = useMemo(() => {
    const work: Todo[] = [];
    const other: Todo[] = [];
    for (const t of pendingTodos) {
      // 其余三类（运动 / 投资 / 生活）和未分类都算「非工作」
      (t.category === 'work' ? work : other).push(t);
    }
    return { work, other };
  }, [pendingTodos]);

  const visibleTodos = scope === 'work' ? scopedPending.work : scopedPending.other;
  // 「另一档」用于空态回跳：工作空了就指引你去非工作，反之亦然
  const otherScope: TodoScope = scope === 'work' ? 'other' : 'work';
  const otherScopeCount = scope === 'work' ? scopedPending.other.length : scopedPending.work.length;

  // 输入时的分类预判：提交后会落到哪一档。
  // 只在「会落到另一档」时提示——否则你在工作档写了「买菜」，提交后它从列表里消失，
  // 你会以为没加上，再输一遍。
  const draft = useMemo(() => {
    const content = inputValue.trim();
    if (!content) return null;
    const category = categorizeTodo(content);
    const targetScope: TodoScope = category === 'work' ? 'work' : 'other';
    return { category, offScope: targetScope !== scope };
  }, [inputValue, scope]);

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

        {/* 固定高度的提示槽：有内容时显示、无内容时留白，避免输入过程中列表跟着跳 */}
        <View style={styles.draftSlot}>
          {draft?.offScope && (
            <View style={styles.draftHint}>
              <View style={[styles.draftDot, { backgroundColor: categoryColor(draft.category) }]} />
              <Text style={styles.draftText}>
                将归入「{categoryLabel(draft.category)}」· 不在当前档
              </Text>
            </View>
          )}
        </View>

        <TodayDoneCard items={todayDone} onUndo={(id) => toggleTodo(id)} />

        {/* 视角切换紧贴列表：它只作用于下方列表，战果卡是全局战绩，所以留在它上面 */}
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, scope === 'work' && styles.segmentItemActive]}
            onPress={() => setScope('work')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentLabel, scope === 'work' && styles.segmentLabelActive]}>
              工作
            </Text>
            <Text style={[styles.segmentCount, scope === 'work' && styles.segmentCountActive]}>
              {scopedPending.work.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentItem, scope === 'other' && styles.segmentItemActive]}
            onPress={() => setScope('other')}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentLabel, scope === 'other' && styles.segmentLabelActive]}>
              非工作
            </Text>
            <Text style={[styles.segmentCount, scope === 'other' && styles.segmentCountActive]}>
              {scopedPending.other.length}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={visibleTodos}
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
                <Text style={styles.emptyTitle}>{SCOPE_LABEL[scope]}没有待办</Text>
                {otherScopeCount > 0 ? (
                  <TouchableOpacity
                    style={styles.emptyLinkWrap}
                    onPress={() => setScope(otherScope)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyLink}>
                      {SCOPE_LABEL[otherScope]}还有 {otherScopeCount} 条 →
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.emptyHint}>在上面输入一条，按回车即可添加</Text>
                )}
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
    marginBottom: spacing.xs,
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
  // 固定高度：提示出现/消失时下方内容不位移
  draftSlot: {
    minHeight: 22,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  draftHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.xs,
  },
  draftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  draftText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: fontSans,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginBottom: spacing.sm,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radius.sm,
    // 未选中也给透明描边，避免选中时多出 1px 造成位移
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentItemActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  segmentLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: fontSans,
  },
  segmentLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  segmentCount: {
    marginLeft: 6,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: fontMono,
  },
  segmentCountActive: {
    color: colors.primary,
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
  emptyLinkWrap: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emptyLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: fontSans,
    fontWeight: '500',
  },
});
