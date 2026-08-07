import type { NotificationType } from '@/api/types';

const TYPE_LABELS: Record<NotificationType, string> = {
  WEEKLY_REFLECTION: '주간 회고',
  EXPERIMENT_MISSION: '오늘의 작은 실험',
  DAILY_QUOTE: '오늘의 문장',
};

export function notificationTypeLabel(type: NotificationType): string {
  return TYPE_LABELS[type] ?? type;
}

// 알림 탭 시 이동할 목적지(naroom-api NotificationDispatchService가 보내는 data.notificationType과 대응).
// 정확한 항목(예: 어떤 주간 회고인지) ID는 알림에 실려오지 않아, 해당 유형을 확인할 수 있는 탭으로 이동한다.
const TYPE_ROUTES: Record<NotificationType, string> = {
  WEEKLY_REFLECTION: '/(app)/lifetime',
  EXPERIMENT_MISSION: '/experiment/today',
  DAILY_QUOTE: '/(app)/home',
};

export function notificationTypeRoute(type: string): string {
  return TYPE_ROUTES[type as NotificationType] ?? '/(app)/home';
}
