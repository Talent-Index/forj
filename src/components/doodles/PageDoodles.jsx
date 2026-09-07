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
} = {}) {
  const [ready, setReady] = useState(false);
  const denseCount = useViewportDoodleCount(count);
  const theme = PAGE_DOODLE_THEME[page] || "default";
  const items = useMemo(() => {
    if (!ready) return [];
    return buildDenseDoodleField({
      seed: `page:${page}`,
      theme,
      count: denseCount,
      animateCount: animate ? 8 : 0,
    });
  }, [page, theme, denseCount, animate, ready]);

  useEffect(() => {
    let cancelled = false;
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
  }, [page]);

  if (!ready || !items.length) return null;

  return (
    <div className={`page-doodles ${className}`.trim()} aria-hidden="true">
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
