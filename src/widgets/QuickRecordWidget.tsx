import { FlexWidget, TextWidget } from 'react-native-android-widget';

// IA §22.1 "위젯" - 빠른 기록 위젯은 홈의 "빠른 기록" 버튼과 같은 성격이라 목록성 데이터가 필요 없다.
// 딥링크로 기록 유형 선택 화면을 바로 여는 진입점 역할만 한다.
export function QuickRecordWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'naroomapp://record/type' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2A2A28',
        borderRadius: 16,
        padding: 16,
      }}>
      <TextWidget text="＋" style={{ fontSize: 28, color: '#F5F5F0' }} />
      <TextWidget text="빠른 기록" style={{ fontSize: 13, color: '#F5F5F0', marginTop: 4 }} />
    </FlexWidget>
  );
}
