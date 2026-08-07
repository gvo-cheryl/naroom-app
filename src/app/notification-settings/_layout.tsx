import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/auth/AuthContext";

export default function NotificationSettingsLayout() {
  const { state } = useAuth();

  if (state.status !== "active") {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
