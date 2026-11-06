import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  LayoutChangeEvent,
} from 'react-native';
import { cardBase, colors, fontSize, fontSans, spacing } from '@/theme/tokens';
import { Checkbox } from './Checkbox';
import { CategoryDot } from './CategoryDot';
import { Todo } from '@/types';

interface TodoItemProps {
  todo: Todo;
  /** 切换完成状态。返回 false 表示写库失败，组件会把视觉状态回退 */
  onToggle: () => Promise<boolean> | void;
  /** 删除回调。不传则不渲染删除按钮 */
  onDelete?: () => void;
  /** 保存回调。不传则内容不可编辑（归档页复用只读形态） */
  onSave?: (content: string) => void;
}

// 完成动画时间轴（毫秒）：勾弹出 → 高亮 → 停留 → 收缩离场
const POP_MS = 160;
const HIGHLIGHT_MS = 140;
const HOLD_MS = 220;
const EXIT_MS = 240;

// transform / opacity 可走原生驱动；height 和 backgroundColor 不能
const NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * 单条待办卡片。
 *  - 浏览态：点文字进编辑（仅在传了 onSave 时）
 *  - 编辑态：原地变输入框，回车/失焦保存，Esc 取消
 *  - 完成态：先播 4 段动画，动画结束后才写库（视觉优先，网络在后台跑）
 */
export function TodoItem({ todo, onToggle, onDelete, onSave }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.content);

  // 正在播完成动画（还没写库）
  const [completing, setCompleting] = useState(false);
  // 正在收缩离场（此时才锁死高度，之前保持自适应）
  const [exiting, setExiting] = useState(false);
  // 实测卡片高度，收缩动画要用
  const [boxHeight, setBoxHeight] = useState<number | null>(null);

  const pop = useRef(new Animated.Value(1)).current; // 勾选缩放
  const highlight = useRef(new Animated.Value(0)).current; // 0 常态 1 完成高亮
  const exit = useRef(new Animated.Value(0)).current; // 0 在场 1 离场

  // 「已经在收尾」标记。commit 与 onBlur 会先后触发，用它挡掉第二次
  const settlingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const editable = typeof onSave === 'function';
  // 本地 completing 也视为「已勾上」，这样动画一开始勾就填充了
  const visuallyDone = todo.isCompleted || completing;

  // ---------- 行内编辑 ----------
  const startEdit = () => {
    if (!editable || completing) return;
    setDraft(todo.content);
    settlingRef.current = false;
    setIsEditing(true);
  };

  const commit = () => {
    if (settlingRef.current) return;
    settlingRef.current = true;
    setIsEditing(false);

    const next = draft.trim();
    if (!next) return; // 空内容 = 取消编辑
    if (next === todo.content) return; // 没改就不发请求
    onSave?.(next);
  };

  const cancel = () => {
    if (settlingRef.current) return;
    settlingRef.current = true;
    setIsEditing(false);
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Escape') cancel();
  };

  // ---------- 完成动画 ----------
  const resetVisuals = () => {
    setCompleting(false);
    setExiting(false);
    pop.setValue(1);
    Animated.parallel([
      Animated.timing(exit, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(highlight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleToggle = () => {
    // 取消完成（归档页 / 今日完成撤销）：直接执行，不需要退场动画
    if (todo.isCompleted) {
      onToggle();
      return;
    }
    if (completing) return; // 动画进行中，防重复点击
    setCompleting(true);

    // ① 勾选弹出：放大再回弹，手指离开屏幕前就有反馈
    Animated.sequence([
      Animated.timing(pop, {
        toValue: 1.18,
        duration: POP_MS / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(pop, {
        toValue: 1,
        duration: POP_MS / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }),
    ]).start();

    // ② 卡片泛蓝高亮
    Animated.timing(highlight, {
      toValue: 1,
      duration: HIGHLIGHT_MS,
      useNativeDriver: false,
    }).start();

    // ③ 停留一下让人看清「完成了」，再收缩离场
    timerRef.current = setTimeout(() => {
      setExiting(true);
      Animated.timing(exit, {
        toValue: 1,
        duration: EXIT_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // height 动画不能走原生驱动
      }).start(async ({ finished }) => {
        if (!finished) return;
        // ④ 动画结束才写库：网络在后台跑，用户无感
        const ok = await Promise.resolve(onToggle());
        if (ok === false) resetVisuals(); // 写库失败 → 视觉回退，别假装完成
      });
    }, HOLD_MS);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    if (exiting) return; // 收缩过程中高度是被我们锁住的，不要重新测量
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== boxHeight) setBoxHeight(h);
  };

  // ---------- 动画样式 ----------
  const wrapperStyle: any = {
    opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [{ translateY: exit.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
  };

  if (exiting && boxHeight != null) {
    // 锁死高度并收到 0，下方条目平滑上移，不留空洞
    wrapperStyle.height = exit.interpolate({ inputRange: [0, 1], outputRange: [boxHeight, 0] });
    wrapperStyle.marginBottom = exit.interpolate({
      inputRange: [0, 1],
      outputRange: [spacing.sm, 0],
    });
    wrapperStyle.overflow = 'hidden';
  } else {
    wrapperStyle.marginBottom = spacing.sm;
  }

  const cardBg = highlight.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.primarySoft],
  });
  const cardBorder = highlight.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primaryBorder],
  });

  return (
    <Animated.View style={wrapperStyle} onLayout={handleLayout}>
      <Animated.View
        style={[cardBase, styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      >
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Checkbox checked={visuallyDone} onToggle={handleToggle} />
        </Animated.View>

        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commit}
            onBlur={commit}
            onKeyPress={handleKeyPress}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            placeholder="待办内容"
            placeholderTextColor={colors.textMuted}
          />
        ) : (
          <TouchableOpacity
            style={styles.contentArea}
            onPress={startEdit}
            activeOpacity={editable ? 0.6 : 1}
            disabled={!editable}
          >
            <Text
              style={[styles.content, visuallyDone && styles.contentCompleted]}
              numberOfLines={2}
            >
              {todo.content}
            </Text>
            <CategoryDot category={todo.category} style={styles.meta} />
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  contentArea: {
    flex: 1,
    marginLeft: spacing.md,
  },
  content: {
    fontSize: fontSize.md,
    color: colors.text,
    fontFamily: fontSans,
    lineHeight: 21,
  },
  contentCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  meta: {
    marginTop: spacing.xs,
  },
  editInput: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    fontFamily: fontSans,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
  },
  deleteBtn: {
    paddingLeft: spacing.md,
  },
  deleteText: {
    fontSize: 22,
    color: colors.danger,
    lineHeight: 24,
  },
});
