import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/auth/AuthContext";

// 이미 인증된 상태로 로그인 화면에 직접 진입하면(딥링크 등) 알맞은 곳으로 돌려보낸다.
export default function AuthLayout() {
  const { state } = useAuth();

  if (state.status === "onboarding_required") {
    return <Redirect href="/(onboarding)" />;
  }
  if (state.status === "active") {
    return <Redirect href="/(app)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
