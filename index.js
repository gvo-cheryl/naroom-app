// Expo Router의 기본 엔트리(expo-router/entry)에 위젯 태스크 핸들러 등록을 얹은 커스텀 엔트리다.
// react-native-android-widget의 registerWidgetTaskHandler는 AppRegistry 등록 시점에 함께 호출해야 한다
// (위젯 스파이크 문서 참고).
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);
