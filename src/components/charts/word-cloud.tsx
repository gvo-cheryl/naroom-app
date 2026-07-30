import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export interface WordCloudItem {
  label: string;
  value: number;
  color: string;
  onPress?: () => void;
}

// 프로토타입 word cloud(.cloud) 대응. 글자 크기는 등장 횟수를 나타낼 뿐 중요도를 뜻하지 않는다.
export function WordCloud({ items }: { items: WordCloudItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const fontSize = 13 + Math.round((item.value / max) * 11);
        return (
          <Pressable key={item.label} onPress={item.onPress} style={styles.item} hitSlop={4}>
            <ThemedText style={{ fontSize, color: item.color }}>{item.label}</ThemedText>
            <ThemedText type="small" themeColor="textTertiary">
              {' '}
              {item.value}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});
