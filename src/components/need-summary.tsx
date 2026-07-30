import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface NeedSummaryProps {
  need: string;
}

// 체크인 완료/요약 화면들(checkin 완료, 홈, 하루 상세)에서 "지금 필요한 것"을 보여줄 때 쓴다.
// 제목은 다른 항목 제목과 같은 스타일로, 실제 값만 태그 모양으로 구분한다.
export function NeedSummary({ need }: NeedSummaryProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        지금 필요한 것
      </ThemedText>
      <View style={[styles.chip, { borderColor: theme.border }]}>
        <ThemedText type="small">{need}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.three,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
