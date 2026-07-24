import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/auth/AuthContext";

export default function OnboardingLayout() {
  const { state } = useAuth();

  if (state.status === "active") {
    return <Redirect href="/(app)/home" />;
  }
  if (state.status !== "onboarding_required") {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
