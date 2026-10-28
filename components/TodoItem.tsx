import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { CategoryDot } from './CategoryDot';
import { colors, fontSize, fontSans, spacing } from '@/theme/tokens';
import { Todo } from '@/types';

interface TodoItemProps {
  todo: Todo;
  /** 点勾选框：切换完成状态 */
  onToggle: () => void;
  /** 删除回调。不传则不渲染删除按钮 */
  onDelete?: () => void;
  /** 保存回调。不传则内容不可编辑（归档页复用只读形态） */
  onSave?: (content: string) => void;
}

/**
 * 单条待办卡片。三种形态：
 *  - 浏览态：点文字进编辑（仅在传了 onSave 时）
 *  - 编辑态：原地变输入框，回车/失焦保存，Esc 取消
 *  - 已完成态：文字置灰 + 删除线（归档页用）
 */
export function TodoItem({ todo, onToggle, onDelete, onSave }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.content);

  // 「已经在收尾」标记。commit 与 onBlur 会先后触发，
  // 用它挡掉第二次，避免重复保存 / 取消后又把内容存进去。
  const settlingRef = useRef(false);

  const editable = typeof onSave === 'function';

  const startEdit = () => {
    if (!editable) return;
    setDraft(todo.content); // 每次进入编辑都以最新内容为起点
    settlingRef.current = false;
    setIsEditing(true);
  };

  const commit = () => {
    if (settlingRef.current) return;
    settlingRef.current = true;
    setIsEditing(false);

    const next = draft.trim();
    if (!next) return; // 空内容 = 取消编辑，不写库也不清空原内容
    if (next === todo.content) return; // 没改就不发请求
    onSave?.(next);
  };

  const cancel = () => {
    if (settlingRef.current) return;
    settlingRef.current = true;
    setIsEditing(false);
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    // Esc 取消（Web 端顺手；移动端用失焦/回车收尾）
    if (e.nativeEvent.key === 'Escape') cancel();
  };

  return (
    <Card style={styles.card}>
      <Checkbox checked={todo.isCompleted} onToggle={onToggle} />

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
            style={[styles.content, todo.isCompleted && styles.contentCompleted]}
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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
