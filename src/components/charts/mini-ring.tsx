import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface MiniRingProps {
  pct: number | null;
  color: string;
  label: string;
  valueLabel: string;
}

const R = 22;
const STROKE_WIDTH = 7;
const CIRCUMFERENCE = 2 * Math.PI * R;

// 프로토타입 miniRing() 대응. 대표값(가장 자주 나타난 단계)을 진행 링 하나로 보여준다.
export function MiniRing({ pct, color, label, valueLabel }: MiniRingProps) {
  const theme = useTheme();
  const value = pct ?? 0;

  return (
    <View style={styles.wrap}>
      <Svg width={58} height={58} viewBox="0 0 58 58">
        <Circle cx={29} cy={29} r={R} fill="none" stroke={theme.border} strokeWidth={STROKE_WIDTH} />
        <Circle
          cx={29}
          cy={29}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE * (value / 100)} ${CIRCUMFERENCE}`}
          rotation={-90}
          origin="29, 29"
        />
      </Svg>
      <View>
        <ThemedText type="small" themeColor="textTertiary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold">{pct == null ? '기록 없음' : valueLabel}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
