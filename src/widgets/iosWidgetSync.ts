import { ExtensionStorage } from '@bacons/apple-targets';
import { Platform } from 'react-native';

import type { QuoteSummary } from '@/api/types';

// iOS 위젯은 앱과 별도 프로세스라 JS를 실행하지 못한다 - App Group(UserDefaults)으로 데이터를
// 공유하는 표준 WidgetKit 패턴을 따른다(스파이크 문서 §4). Android는 위젯 태스크 핸들러가 직접
// API를 호출하므로 이 브릿지가 필요 없다.
const APP_GROUP = 'group.io.naroom.app';

export function syncTodayQuoteToWidget(quote: QuoteSummary | null): void {
  if (Platform.OS !== 'ios') {
    return;
  }
  const storage = new ExtensionStorage(APP_GROUP);
  storage.set('todayQuoteText', quote?.text ?? undefined);
  storage.set('todayQuoteAuthor', quote?.authorName ?? undefined);
  ExtensionStorage.reloadWidget();
}
