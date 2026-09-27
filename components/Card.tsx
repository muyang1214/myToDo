import React from 'react';
import { View, ViewStyle } from 'react-native';
import { cardBase } from '@/theme/tokens';

interface CardProps {
  style?: ViewStyle;
  children: React.ReactNode;
}

/**
 * 通用卡片容器：白底 + 0.5px 描边（来自 tokens.cardBase）。
 * 待办项、归档项、统计条都用它，保证全站卡片质感一致。
 */
export function Card({ style, children }: CardProps) {
  return <View style={[cardBase, style]}>{children}</View>;
}
