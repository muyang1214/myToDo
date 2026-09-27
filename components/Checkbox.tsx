import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { colors } from '@/theme/tokens';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}

/**
 * 圆形勾选框。待办页点它 = 标记完成（→ 进归档）；
 * 归档页点它 = 取消完成（→ 回待办）。蓝色填充 + 白勾表示已完成态。
 */
export function Checkbox({ checked, onToggle, size = 24 }: CheckboxProps) {
  return (
    <TouchableOpacity onPress={onToggle} hitSlop={8} activeOpacity={0.7}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && (
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: size * 0.58,
              fontWeight: '700',
              includeFontPadding: false,
            }}
          >
            ✓
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
