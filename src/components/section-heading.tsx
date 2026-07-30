import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SectionHeadingProps {
  icon: SymbolViewProps['name'];
  title: string;
  style?: StyleProp<ViewStyle>;
}

// 화면이 문장 나열처럼 보이지 않도록, 섹션 제목 앞에 아이콘을 붙여 구획을 시각적으로 구분한다.
// expo-symbols는 이미 하단 탭에 쓰고 있어 새 아이콘 라이브러리 없이 iOS(SF Symbols)/
// Android(Material Symbols) 양쪽을 커버한다.
export function SectionHeading({ icon, title, style }: SectionHeadingProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, style]}>
      <SymbolView name={icon} size={17} tintColor={theme.textSecondary} />
      <ThemedText type="default">{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
