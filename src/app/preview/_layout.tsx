import { Stack } from "expo-router";

// 회원 인증(AuthContext)과 분리된 preview 전용 스택 - (app)/(auth) 그룹과 달리 로그인 상태를
// 검사하지 않는다. 접근은 preview token 자체가 보장한다(백엔드 /api/v1/preview/** 인증).
export default function PreviewLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
