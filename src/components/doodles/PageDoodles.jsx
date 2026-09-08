import { useEffect, useMemo, useState } from "react";
import { DoodleField } from "./DoodleField.jsx";
import { buildDenseDoodleField, PAGE_DOODLE_THEME } from "./buildDenseDoodleField.js";

function useViewportDoodleCount(baseCount) {
  const [count, setCount] = useState(baseCount);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setCount(baseCount);
      return undefined;
    }
    const narrow = window.matchMedia("(max-width: 860px)");
    const sync = () => setCount(narrow.matches ? Math.min(36, baseCount) : baseCount);
    sync();
    narrow.addEventListener("change", sync);
    return () => narrow.removeEventListener("change", sync);
  }, [baseCount]);
  return count;
}

/**
 * Page-level atmospheric doodle field (100+ on desktop).
 * Mounts after first paint so route content paints first.
 * Shell fields stay static (no per-glyph IntersectionObservers).
 */
export function PageDoodles({
  page = "default",
  count = 112,
  className = "",
  animate = false,
  animateCount = 8,
} = {}) {
  const [ready, setReady] = useState(false);
  const denseCount = useViewportDoodleCount(count);
  const theme = PAGE_DOODLE_THEME[page] || "default";
  const popCount = animate ? Math.max(0, Math.min(animateCount, denseCount)) : 0;
  const items = useMemo(() => {
    if (!ready) return [];
    return buildDenseDoodleField({
      seed: `page:${page}`,
      theme,
      count: denseCount,
      animateCount: popCount,
    });
  }, [page, theme, denseCount, popCount, ready]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const start = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 280 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const timer = window.setTimeout(start, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [page, popCount]);

  if (!ready || !items.length) return null;

  return (
    <div
      className={`page-doodles ${animate ? "is-animated" : ""} ${className}`.trim()}
      aria-hidden="true"
    >
      <DoodleField
        items={items}
        dense
        animate={false}
        trigger="immediate"
      />
    </div>
  );
}

export default PageDoodles;
