/**
 * naroom_beta1_prototype.html의 CSS 커스텀 프로퍼티(:root, [data-theme="dark"])에서 옮긴 값이다.
 * 프로토타입과 다른 값을 쓰게 되면 반드시 여기부터 바꾸고, 화면 코드에 직접 색상 hex를 적지 않는다.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E2226',
    textSecondary: '#4B534E',
    textTertiary: '#7B847E',
    background: '#E9EBE5',
    backgroundElement: '#FBFCF9',
    backgroundSelected: '#F1F3EE',
    border: '#DCE0D8',
  },
  dark: {
    text: '#E8ECE7',
    textSecondary: '#B4BCB6',
    textTertiary: '#838C86',
    background: '#121517',
    backgroundElement: '#1C2124',
    backgroundSelected: '#22272A',
    border: '#2A3033',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// 라이트/다크와 무관하게 항상 같은 값을 쓰는 외부 서비스 브랜드 색상(카카오 등).
// 프로토타입도 이건 토큰화하지 않고 그대로 hex를 쓴다 — 외부 브랜드 가이드 값이라 우리 테마를 안 탄다.
export const BrandColors = {
  kakaoYellow: '#FEE500',
  onKakaoYellow: '#191600',
} as const;

// 프로토타입의 --serif(Nanum Myeongjo)에 대응한다. 실제 로딩은 앱 진입점의 useFonts로 한다.
// Pretendard(--sans)는 아직 폰트 자산을 번들하지 않아 시스템 기본 산세리프로 대체한다(추후 보강).
export const AppFonts = {
  serifRegular: 'NanumMyeongjo_400Regular',
  serifBold: 'NanumMyeongjo_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// 프로토타입 --r-s/--r-m/--r-l, 버튼(14px)·chip/pill(완전 원형) 반경.
export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  button: 14,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
