import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { getTodayQuote } from '@/api';
import { getValidAccessToken } from '@/auth/authManager';
import { logger } from '@/lib/logger';

import { QuickRecordWidget } from './QuickRecordWidget';
import { TodayQuoteWidget } from './TodayQuoteWidget';

// Android 위젯은 메인 앱과 별도의 JS 실행 컨텍스트에서 갱신되므로, 오늘의 문장은 캐시를 따로 두지 않고
// 이 시점에 직접 API를 호출한다(GET /quotes/today는 이미 존재 - 신규 API 불필요, 스파이크 문서 §5).
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction } = props;
  if (widgetAction !== 'WIDGET_ADDED' && widgetAction !== 'WIDGET_UPDATE') {
    return;
  }

  if (widgetInfo.widgetName === 'QuickRecord') {
    props.renderWidget(QuickRecordWidget());
    return;
  }

  if (widgetInfo.widgetName === 'TodayQuote') {
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        props.renderWidget(TodayQuoteWidget({ text: '로그인하면 오늘의 문장을 볼 수 있어요.', authorName: null }));
        return;
      }
      const quote = await getTodayQuote(accessToken);
      props.renderWidget(TodayQuoteWidget({ text: quote.text, authorName: quote.authorName }));
    } catch (error) {
      logger.error('widgets.todayQuote', 'failed to load today quote for widget', {
        name: error instanceof Error ? error.name : undefined,
      });
      props.renderWidget(TodayQuoteWidget({ text: '오늘의 문장을 불러오지 못했어요.', authorName: null }));
    }
  }
}
