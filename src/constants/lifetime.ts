import type { PeriodReflectionFeatureType, PeriodReflectionSummary } from '@/api/types';

export const PERIOD_REFLECTION_FEATURE_TYPE_LABELS: Record<PeriodReflectionFeatureType, string> = {
  THREE_DAY_REFLECTION: '3일 회고',
  WEEKLY_REFLECTION: '주간 회고',
};

export function periodReflectionFeatureTypeLabel(featureType: PeriodReflectionFeatureType): string {
  return PERIOD_REFLECTION_FEATURE_TYPE_LABELS[featureType];
}

// LifeTime 화면의 "지난 회고" 목록과 타임라인 카드가 같은 미리보기 문구를 쓴다.
export function periodReflectionPreviewText(reflection: PeriodReflectionSummary): string {
  if (reflection.status === 'COMPLETED') {
    return reflection.summaryText || '요약 없음';
  }
  if (reflection.status === 'FAILED') {
    return '회고를 만들지 못했어요';
  }
  return '정리 중이에요';
}
