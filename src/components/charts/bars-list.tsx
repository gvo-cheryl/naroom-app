import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BarItem {
  label: string;
  value: number;
  onPress?: () => void;
}

// 프로토타입 bars() 대응. 가로 막대로 등장 횟수를 비교한다(점수·순위가 아니라 횟수).
export function BarsList({ items, color }: { items: BarItem[]; color: string }) {
  const theme = useTheme();
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const Row = item.onPress ? Pressable : View;
        return (
          <Row key={item.label} style={styles.row} onPress={item.onPress}>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.label}>
              {item.label}
            </ThemedText>
            <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.fill, { width: `${Math.round((item.value / max) * 100)}%`, backgroundColor: color }]} />
            </View>
            <ThemedText type="small" themeColor="textTertiary" style={styles.count}>
              {item.value}
            </ThemedText>
          </Row>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    width: 72,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  count: {
    width: 28,
    textAlign: 'right',
  },
});
