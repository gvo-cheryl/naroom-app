import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { updateDevicePushToken } from '@/api';
import { getDevicePlatform, getOrCreateInstallationKey } from '@/auth/deviceIdentity';
import { logger } from '@/lib/logger';

// IA §17 M2 "알림 표현 원칙": 권한은 앱이 강제로 요구하지 않고, 로그인 이후 자연스럽게 한 번 물어본다.
// 거부해도 앱 사용에는 지장이 없다 - 실패해도 조용히 넘어간다(로그만 남김).
export async function registerForPushNotificationsAsync(accessToken: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    const finalStatus =
      existing.status === 'granted' ? existing.status : (await Notifications.requestPermissionsAsync()).status;
    if (finalStatus !== 'granted') {
      logger.debug('notifications.register', 'permission not granted');
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (typeof projectId !== 'string') {
      logger.warn('notifications.register', 'missing EAS projectId; skipping token registration');
      return;
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    const installationKey = await getOrCreateInstallationKey();
    await updateDevicePushToken(accessToken, installationKey, pushToken);
    logger.debug('notifications.register', 'push token registered', { platform: getDevicePlatform() });
  } catch (error) {
    logger.error('notifications.register', 'failed to register for push notifications', {
      name: error instanceof Error ? error.name : undefined,
    });
  }
}
