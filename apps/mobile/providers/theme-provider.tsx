import { useColorScheme } from "react-native";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  darkColors,
  lightColors,
  radii,
  shadows,
  spacing,
  typography,
  type ThemeColors,
  type ThemeMode,
} from "@/theme";

export interface ThemeValue {
  readonly mode: ThemeMode;
  readonly resolvedScheme: "light" | "dark";
  readonly colors: ThemeColors;
  readonly spacing: typeof spacing;
  readonly radii: typeof radii;
  readonly shadows: typeof shadows;
  readonly typography: typeof typography;
  readonly setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

interface ThemeProviderProps {
  readonly children: ReactNode;
  readonly initialMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  initialMode = "system",
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const value = useMemo<ThemeValue>(() => {
    const resolvedScheme =
      mode === "system"
        ? systemScheme === "dark"
          ? "dark"
          : "light"
        : mode;

    return {
      mode,
      resolvedScheme,
      colors: resolvedScheme === "dark" ? darkColors : lightColors,
      spacing,
      radii,
      shadows,
      typography,
      setMode,
    };
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
