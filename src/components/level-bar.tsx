import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface LevelBarProps {
  label: string;
  value: number;
  levelLabel: string;
  color: string;
}

// 완료된 체크인을 요약해서 보여줄 때 쓰는 읽기 전용 게이지. 드래그되는 LevelSlider와
// 같은 트랙 색상 언어를 쓰되, 여기서는 조작 없이 채워진 정도만 보여준다.
export function LevelBar({ label, value, levelLabel, color }: LevelBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold">{levelLabel}</ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    marginTop: Spacing.half,
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
