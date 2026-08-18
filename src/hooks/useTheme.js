import { useCallback, useEffect, useState } from "react";
import {
  applyDocumentTheme,
  getInitialReducedMotion,
  getInitialTheme,
  persistReducedMotion,
  persistTheme,
} from "../utils/theme";

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [reducedMotion, setReducedMotionState] = useState(getInitialReducedMotion);

  useEffect(() => {
    applyDocumentTheme(theme, reducedMotion);
  }, [theme, reducedMotion]);

  const setTheme = useCallback((next) => {
    const value = next === "dark" ? "dark" : "light";
    setThemeState(value);
    persistTheme(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const setReducedMotion = useCallback((value) => {
    const on = Boolean(value);
    setReducedMotionState(on);
    persistReducedMotion(on);
  }, []);

  return { theme, setTheme, toggleTheme, reducedMotion, setReducedMotion };
}
