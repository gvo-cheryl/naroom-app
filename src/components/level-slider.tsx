import Slider from '@react-native-community/slider';
import type { SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SectionHeading } from '@/components/section-heading';
import { ThemedText } from '@/components/themed-text';
import { levelLabelIndex } from '@/constants/checkin';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface LevelSliderProps {
  icon: SymbolViewProps['name'];
  title: string;
  levels: string[];
  value: number | null;
  onChange: (value: number) => void;
  color: string;
  hint?: string;
}

// 감정 강도·에너지를 버튼 선택이 아니라 드래그로 고르게 한다. 저장값은 0~100(더 세밀한 값을
// 받기 위해)이고, 화면에는 levels 개수만큼 균등 구간으로 나눈 라벨만 보여준다. 값이 없을 때
// (value=null)는 가운데에서 보여주되 "아직 고르지 않았어요"로 구분하고, 실제로 드래그해야만
// onChange가 불려 저장 대상이 된다.
export function LevelSlider({ icon, title, levels, value, onChange, color, hint }: LevelSliderProps) {
  const theme = useTheme();
  const [dragValue, setDragValue] = useState<number | null>(null);
  const displayValue = dragValue ?? value ?? 50;
  const activeLabelIndex = levelLabelIndex(displayValue, levels.length);

  return (
    <View style={styles.container}>
      <SectionHeading icon={icon} title={title} />
      {hint && (
        <ThemedText type="small" themeColor="textTertiary" style={styles.hint}>
          {hint}
        </ThemedText>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.valueLabel}>
        {value === null && dragValue === null ? '아직 고르지 않았어요' : levels[activeLabelIndex]}
      </ThemedText>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={displayValue}
        minimumTrackTintColor={color}
        maximumTrackTintColor={theme.border}
        thumbTintColor={color}
        onValueChange={setDragValue}
        onSlidingComplete={(level) => {
          setDragValue(null);
          onChange(level);
        }}
      />

      <View style={styles.ticksRow}>
        {levels.map((label, index) => (
          <ThemedText
            key={label}
            type="small"
            themeColor={index === activeLabelIndex ? 'text' : 'textTertiary'}
            style={styles.tick}>
            {label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.five,
  },
  hint: {
    marginTop: Spacing.one,
  },
  valueLabel: {
    marginTop: Spacing.two,
  },
  slider: {
    marginTop: Spacing.one,
  },
  ticksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tick: {
    fontSize: 11,
  },
});
