import { Redirect } from "expo-router";

import { useAuth } from "@/auth/AuthContext";
import { AppSplash } from "@/components/app-splash";

// 앱 진입점: authentication.md의 "앱 시작 판정 순서"에 따라 알맞은 그룹으로 보낸다.
// 잠금·삭제 대기·확인 실패는 오늘 범위(로그인 전/온보딩 필요/온보딩 완료)에 포함되지 않아
// 우선 로그인 화면으로 보내고, 화면에서 상태별 안내만 보여준다.
export default function AppEntry() {
  const { state } = useAuth();

  switch (state.status) {
    case "loading":
      return <AppSplash />;
    case "onboarding_required":
      return <Redirect href="/(onboarding)" />;
    case "active":
      return <Redirect href="/(app)/home" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
