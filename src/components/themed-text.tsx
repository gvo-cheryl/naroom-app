import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { AppFonts, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'eyebrow'
    | 'heading'
    | 'wordmark';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        type === 'eyebrow' && styles.eyebrow,
        type === 'heading' && styles.heading,
        type === 'wordmark' && styles.wordmark,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
  // 프로토타입 .eyebrow
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
  },
  // 프로토타입 h2.sc
  heading: {
    fontFamily: AppFonts.serifRegular,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  // 프로토타입 A01/A02의 "나로움" 워드마크
  wordmark: {
    fontFamily: AppFonts.serifRegular,
    fontSize: 34,
    letterSpacing: 2,
    fontWeight: '400',
  },
});
