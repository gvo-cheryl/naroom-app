import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface TodayQuoteWidgetProps {
  text: string;
  authorName: string | null;
}

// IA §22.1 "위젯": 기록 원문·감정·에너지는 절대 노출하지 않는다 - 오늘의 문장 본문만 보여준다.
export function TodayQuoteWidget({ text, authorName }: TodayQuoteWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'naroomapp://(app)/home' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        backgroundColor: '#E9EBE5',
        borderRadius: 16,
        padding: 16,
      }}>
      <TextWidget
        text={text}
        style={{ fontSize: 14, color: '#2A2A28' }}
        maxLines={4}
      />
      {authorName && (
        <TextWidget
          text={`— ${authorName}`}
          style={{ fontSize: 11, color: '#6B6B66', marginTop: 6 }}
        />
      )}
    </FlexWidget>
  );
}
