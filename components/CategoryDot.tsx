import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { colors, fontSans } from '@/theme/tokens';
import { categoryColor, categoryLabel } from '@/utils/category';

interface CategoryDotProps {
  category?: string | null;
  showLabel?: boolean;
  style?: ViewStyle;
}

/**
 * 分类色点 + 可选文字。替代原来的裸文字 `· work`。
 * 颜色与标签都从 utils/category 取，单一数据源。
 */
export function CategoryDot({ category, showLabel = true, style }: CategoryDotProps) {
  const color = categoryColor(category);
  const label = categoryLabel(category);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      {showLabel && (
        <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: fontSans }}>
          {label}
        </Text>
      )}
    </View>
  );
}
