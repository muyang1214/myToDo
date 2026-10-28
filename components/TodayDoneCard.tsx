import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, fontSize, fontSans, fontMono, spacing } from '@/theme/tokens';
import { toLocalTimeLabel } from '@/utils/date';
import { Todo } from '@/types';

/** 折叠时默认展示几条 */
const COLLAPSED_COUNT = 3;
/** 展开时最多展示几条：再多样例会挤掉下方待办列表 */
const MAX_EXPANDED = 10;

interface TodayDoneCardProps {
  /** 今日已完成的待办，按完成时间倒序 */
  items: Todo[];
  /** 点某一条 → 取消完成，退回待办列表 */
  onUndo: (id: string) => void;
}

/**
 * 今日战果卡：正反馈区。
 * 完成数量放大 + 最近完成的几条可见（只有数字没有内容，是看不到成就感的）。
 * 刻意不做进度百分比——待办基数大时 2/30=7% 反而是负反馈。
 */
export function TodayDoneCard({ items, onUndo }: TodayDoneCardProps) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? items.slice(0, MAX_EXPANDED) : items.slice(0, COLLAPSED_COUNT);
  const restCount = items.length - COLLAPSED_COUNT;
  const canExpand = restCount > 0;
  const hiddenWhenExpanded = items.length - visible.length;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>今日完成</Text>
        <Text style={styles.headerCount}>{items.length}</Text>
        {canExpand && (
          <TouchableOpacity
            onPress={() => setExpanded((v) => !v)}
            hitSlop={8}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{expanded ? '收起' : `还有 ${restCount} 条`}</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <Text style={styles.emptyHint}>今天还没完成一条，从上面挑一件开始</Text>
      ) : (
        <View style={styles.list}>
          {visible.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.row}
              onPress={() => onUndo(item.id)}
              activeOpacity={0.6}
            >
              <Text style={styles.check}>✓</Text>
              <Text style={styles.content} numberOfLines={1}>
                {item.content}
              </Text>
              <Text style={styles.time}>
                {item.completedAt ? toLocalTimeLabel(item.completedAt) : ''}
              </Text>
            </TouchableOpacity>
          ))}
          {hiddenWhenExpanded > 0 && (
            <Text style={styles.moreHint}>另有 {hiddenWhenExpanded} 条，待归档页查看</Text>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: fontSans,
  },
  headerCount: {
    marginLeft: spacing.sm,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: fontMono,
  },
  toggle: {
    marginLeft: 'auto',
  },
  toggleText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontFamily: fontSans,
  },
  emptyHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontFamily: fontSans,
  },
  list: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  check: {
    width: 16,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontFamily: fontSans,
    textDecorationLine: 'line-through',
  },
  time: {
    marginLeft: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: fontMono,
  },
  moreHint: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: fontSans,
  },
});
