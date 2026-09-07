import { useEffect, useMemo, useState } from "react";
import { DoodleField } from "./DoodleField.jsx";
import { buildDenseDoodleField, PAGE_DOODLE_THEME } from "./buildDenseDoodleField.js";

/**
 * Page-level atmospheric doodle field (100+).
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
  const theme = PAGE_DOODLE_THEME[page] || "default";
  const items = useMemo(
    () => {
      if (!ready) return [];
      return buildDenseDoodleField({
        seed: `page:${page}`,
        theme,
        count,
        animateCount: animate ? 8 : 0,
      });
    },
    [page, theme, count, animate, ready]
  );

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 400 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const timer = window.setTimeout(start, 120);
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
