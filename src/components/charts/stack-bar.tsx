import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface StackBarPart {
  label: string;
  value: number;
  color: string;
}

// 프로토타입 stackBar() 대응. 전체 대비 구성 비율을 누적 막대 하나로 보여준다.
export function StackBar({ parts }: { parts: StackBarPart[] }) {
  const theme = useTheme();
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;

  return (
    <View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <View key={part.label} style={{ width: `${(part.value / total) * 100}%`, backgroundColor: part.color }} />
          ))}
      </View>
      <View style={styles.legendRow}>
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <View key={part.label} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: part.color }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {part.label} {part.value}
              </ThemedText>
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 10,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
