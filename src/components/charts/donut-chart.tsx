import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface DonutPart {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  parts: DonutPart[];
  center?: string;
  sub?: string;
}

const SIZE = 80;
const R = 30;
const STROKE_WIDTH = 11;
const CIRCUMFERENCE = 2 * Math.PI * R;
const CX = 40;
const CY = 40;

// 프로토타입 donut() 대응. stroke-dasharray로 부채꼴을 이어 붙여 비율 도넛을 만든다.
export function DonutChart({ parts, center, sub }: DonutChartProps) {
  const theme = useTheme();
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  let offset = 0;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 80 80">
        <G rotation={-90} origin={`${CX}, ${CY}`}>
          {total > 0 ? (
            parts
              .filter((part) => part.value > 0)
              .map((part) => {
                const length = CIRCUMFERENCE * (part.value / total);
                const circle = (
                  <Circle
                    key={part.label}
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="none"
                    stroke={part.color}
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return circle;
              })
          ) : (
            <Circle cx={CX} cy={CY} r={R} fill="none" stroke={theme.border} strokeWidth={STROKE_WIDTH} />
          )}
        </G>
        {center != null && (
          <>
            <SvgText x={40} y={39} textAnchor="middle" fontSize={16} fill={theme.text}>
              {center}
            </SvgText>
            <SvgText x={40} y={52} textAnchor="middle" fontSize={9} fill={theme.textTertiary}>
              {sub ?? ''}
            </SvgText>
          </>
        )}
      </Svg>
      <View style={styles.legend}>
        {parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <View key={part.label} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: part.color }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {part.label} {total ? Math.round((part.value / total) * 100) : 0}%
              </ThemedText>
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  legend: {
    flex: 1,
    gap: Spacing.one,
  },
  legendRow: {
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
