import type { TagCategory } from '@/api/types';
import type { ThemeColor } from '@/constants/theme';

// 프로토타입 EMOTION_GROUPS/EMO_HUE를 그대로 옮긴다(승인된 분류). 감정을 좋고 나쁨이 아니라
// "결"로 묶어서, 어떤 색으로 표시할지만 정한다 - 판단이나 점수화가 아니다.
export const EMOTION_GROUPS: { group: string; items: string[]; colorKey: ThemeColor }[] = [
  {
    group: '편안한 결',
    items: ['편안함', '안도감', '고마움', '차분함', '홀가분함', '다정함', '만족스러움', '포근함', '느긋함'],
    colorKey: 'moss',
  },
  {
    group: '기운이 도는',
    items: ['기쁨', '설렘', '기대', '즐거움', '자신감', '뿌듯함', '후련함', '벅참', '활기'],
    colorKey: 'sand',
  },
  {
    group: '가라앉는',
    items: ['지침', '무기력', '외로움', '허전함', '슬픔', '서운함', '아쉬움', '그리움', '서글픔'],
    colorKey: 'slate',
  },
  {
    group: '조여드는',
    items: ['불안', '초조함', '긴장', '부담', '조심스러움', '두려움', '걱정', '막막함'],
    colorKey: 'plum',
  },
  {
    group: '뜨거워지는',
    items: ['답답함', '짜증', '화남', '억울함', '서러움', '민망함', '분함'],
    colorKey: 'clay',
  },
  {
    group: '이름 붙이기 어려운',
    items: ['무덤덤함', '복합적인 느낌', '멍함', '낯섦', '궁금함', '싱숭생숭함'],
    colorKey: 'textTertiary',
  },
];

// 감정 이름으로 그 결의 색상 키를 찾는다. 어느 결에도 없는(자유 입력) 감정은 회색조로 둔다.
export function emotionColorKey(name: string): ThemeColor {
  const group = EMOTION_GROUPS.find((g) => g.items.includes(name));
  return group?.colorKey ?? 'textTertiary';
}

// 프로토타입 KIND_COLOR를 그대로 옮긴다. TAG_CATEGORY_LABELS(constants/record.ts)와 짝을 이룬다.
export const TAG_CATEGORY_COLOR_KEY: Record<TagCategory, ThemeColor> = {
  EMOTION: 'slate',
  SITUATION: 'textTertiary',
  NEED: 'moss',
  VALUE: 'sand',
  ACTION: 'plum',
  RECOVERY: 'clay',
  CUSTOM: 'border',
};

export const ANALYTICS_RANGE_OPTIONS: { days: 7 | 14 | 30; label: string }[] = [
  { days: 7, label: '최근 7일' },
  { days: 14, label: '최근 14일' },
  { days: 30, label: '최근 30일' },
];
