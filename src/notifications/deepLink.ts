import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { notificationTypeRoute } from '@/constants/notification';
import { logger } from '@/lib/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 알림 탭 시 유형별 목적지로 이동한다(naroom-api NotificationDispatchService가 보내는
// data.notificationType 기준). 앱 루트에서 한 번만 구독한다.
export function registerNotificationResponseHandler(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const notificationType = response.notification.request.content.data?.notificationType;
    if (typeof notificationType !== 'string') {
      logger.debug('notifications.deepLink', 'response without notificationType; ignoring');
      return;
    }
    router.push(notificationTypeRoute(notificationType) as never);
  });
  return () => subscription.remove();
}
