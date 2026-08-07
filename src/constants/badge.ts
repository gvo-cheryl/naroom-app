import type { BadgeCategory } from '@/api/types';

const CATEGORY_LABELS: Record<string, string> = {
  TRIAL: '시도',
  DISCOVERY: '발견',
  RETURN: '복귀',
  SELF_ORGANIZATION: '자기정리',
};

export function badgeCategoryLabel(category: BadgeCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}
