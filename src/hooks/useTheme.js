import { useCallback, useEffect, useState } from "react";
import {
  MOTION_CHOICE,
  applyDocumentTheme,
  getInitialMotionChoice,
  getInitialReducedMotion,
  getInitialTheme,
  persistReducedMotion,
  persistTheme,
  systemPrefersReducedMotion,
} from "../utils/theme";

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [reducedMotion, setReducedMotionState] = useState(getInitialReducedMotion);
  const [motionChoice, setMotionChoice] = useState(getInitialMotionChoice);
  const [osReducedMotion, setOsReducedMotion] = useState(systemPrefersReducedMotion);

  useEffect(() => {
    applyDocumentTheme(theme, reducedMotion, motionChoice);
  }, [theme, reducedMotion, motionChoice]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setOsReducedMotion(mq.matches);
      if (motionChoice === MOTION_CHOICE.system) {
        setReducedMotionState(mq.matches);
      }
    }
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [motionChoice]);

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
    setMotionChoice(on ? MOTION_CHOICE.reduced : MOTION_CHOICE.full);
    persistReducedMotion(on);
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
    reducedMotion,
    setReducedMotion,
    motionChoice,
    osReducedMotion,
  };
}
