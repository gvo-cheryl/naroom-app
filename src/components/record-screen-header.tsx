import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface RecordScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

// 기록 작성 흐름(R01~R06) 화면들이 공통으로 쓰는 상단 바. headerShown:false로 감춘 네이티브
// 헤더 대신 이 컴포넌트가 뒤로가기와 화면 제목, 필요 시 우측 액션(예: R02 "저장")을 담당한다.
export function RecordScreenHeader({ title, onBack, right }: RecordScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Pressable onPress={onBack ?? (() => router.back())} hitSlop={12} style={styles.side}>
        <ThemedText type="default" themeColor="textSecondary" style={styles.closeLabel}>
          닫기
        </ThemedText>
      </Pressable>
      <ThemedText type="default" style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </ThemedText>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: Spacing.three,
  },
  side: {
    minWidth: 56,
  },
  closeLabel: {
    fontSize: 16,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '700',
  },
});
