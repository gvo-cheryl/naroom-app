import { Redirect } from "expo-router";

import AppTabs from "@/components/app-tabs";
import { useAuth } from "@/auth/AuthContext";

// 인증되지 않았거나 온보딩이 안 끝났으면 이 그룹에 들어올 수 없다.
export default function AppLayout() {
  const { state } = useAuth();

  if (state.status === "onboarding_required") {
    return <Redirect href="/(onboarding)" />;
  }
  if (state.status !== "active") {
    return <Redirect href="/(auth)/login" />;
  }

  return <AppTabs />;
}
