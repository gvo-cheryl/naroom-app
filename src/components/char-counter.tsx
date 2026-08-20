import type { StyleProp, TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface CharCounterProps {
  length: number;
  max: number;
  style?: StyleProp<TextStyle>;
}

// naroom-api ai-policy-architecture.md §4.1: 남은 글자 수를 압박적으로 상시 노출하지 않고,
// 제한에 가까워질 때만 안내한다.
const WARNING_RATIO = 0.8;

export function CharCounter({ length, max, style }: CharCounterProps) {
  if (length < max * WARNING_RATIO) {
    return null;
  }
  const overLimit = length > max;
  return (
    <ThemedText type="small" themeColor={overLimit ? 'clay' : 'textTertiary'} style={style}>
      {length}/{max}
    </ThemedText>
  );
}
