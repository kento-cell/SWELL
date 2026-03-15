import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { ThemeType, getTheme, ThemeConfig } from "@/lib/theme-system";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  designTheme: ThemeType;
  setDesignTheme: (theme: ThemeType) => Promise<void>;
  themeConfig: ThemeConfig;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const [designTheme, setDesignThemeState] = useState<ThemeType>("normal");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getTheme("normal"));
  const [isLoading, setIsLoading] = useState(true);

  // Load design theme preference on mount
  useEffect(() => {
    loadDesignTheme();
  }, []);

  const loadDesignTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem("app_design_theme");
      const theme = (saved as ThemeType) || "normal";
      setDesignThemeState(theme);
      setThemeConfig(getTheme(theme));
    } catch (error) {
      console.error("Error loading design theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme);
  }, [applyScheme]);

  const setDesignTheme = useCallback(async (theme: ThemeType) => {
    try {
      setDesignThemeState(theme);
      setThemeConfig(getTheme(theme));
      await AsyncStorage.setItem("app_design_theme", theme);
    } catch (error) {
      console.error("Error setting design theme:", error);
    }
  }, []);

  useEffect(() => {
    applyScheme(colorScheme);
  }, [applyScheme, colorScheme]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      designTheme,
      setDesignTheme,
      themeConfig,
    }),
    [colorScheme, setColorScheme, designTheme, setDesignTheme, themeConfig],
  );

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}

// Alias for backward compatibility
export const useTheme = useThemeContext;
