import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ArcGaugeProps {
  levelIndex: number | null;
  color: string;
  label: string;
  valueLabel: string;
}

const R = 32;
const CX = 40;
const CY = 40;
const GAP = 6;
const SPAN = (270 - GAP * 4) / 5;

function point(angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
}

// 프로토타입 arcGauge() 대응. 수치 대신 5단계 눈금(활성/비활성)만 보여준다.
export function ArcGauge({ levelIndex, color, label, valueLabel }: ArcGaugeProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Svg width={84} height={84} viewBox="0 0 80 80">
        {[0, 1, 2, 3, 4].map((i) => {
          const a0 = 135 + i * (SPAN + GAP);
          const a1 = a0 + SPAN;
          const [x0, y0] = point(a0);
          const [x1, y1] = point(a1);
          const on = levelIndex != null && i <= levelIndex;
          return (
            <Path
              key={i}
              d={`M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`}
              fill="none"
              stroke={on ? color : theme.border}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={on ? 0.45 + i * 0.14 : 1}
            />
          );
        })}
        <Circle cx={40} cy={40} r={4.5} fill={levelIndex == null ? theme.border : color} opacity={0.85} />
      </Svg>
      <View>
        <ThemedText type="small" themeColor="textTertiary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold">{valueLabel}</ThemedText>
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
