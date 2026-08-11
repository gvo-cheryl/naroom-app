import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useColorScheme as useDeviceColorScheme } from "@/hooks/use-color-scheme";

import { loadThemePreference, saveThemePreference, type ThemePreference } from "./themePreference";

export type ResolvedScheme = "light" | "dark";

interface ThemePreferenceContextValue {
  preference: ThemePreference;
  resolvedScheme: ResolvedScheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let cancelled = false;
    loadThemePreference().then((stored) => {
      if (!cancelled) {
        setPreferenceState(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    saveThemePreference(next);
  }, []);

  // 저장된 값을 아직 못 불러온 최초 순간에도 기기 설정을 기본값으로 써서 깜빡임을 최소화한다.
  const resolvedScheme: ResolvedScheme =
    preference === "system" ? (deviceScheme === "dark" ? "dark" : "light") : preference;

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({ preference, resolvedScheme, setPreference }),
    [preference, resolvedScheme, setPreference],
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error("useThemePreference must be used within a ThemePreferenceProvider");
  }
  return context;
}
