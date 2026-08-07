// @bacons/apple-targets 위젯 타겟 설정. 오늘의 문장·빠른 기록 두 위젯을 WidgetBundle 하나로 묶는다
// (위젯 스파이크 문서 참고). App Group은 app.json의 ios.entitlements와 같은 값이어야 한다.
module.exports = {
  type: 'widget',
  name: 'naroom_widgets',
  displayName: 'Naroom',
  colors: {
    $widgetBackground: '#E9EBE5',
  },
  entitlements: {
    'com.apple.security.application-groups': ['group.io.naroom.app'],
  },
};
