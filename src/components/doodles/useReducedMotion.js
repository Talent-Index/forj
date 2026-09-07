import { useEffect, useState } from "react";

/** Reads document + OS reduced-motion flags. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    const flag = document.documentElement.dataset.reducedMotion === "true";
    const media = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return flag || media;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      const flag = document.documentElement.dataset.reducedMotion === "true";
      setReduced(flag || mq.matches);
    }
    sync();
    mq.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion"],
    });
    return () => {
      mq.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  return reduced;
}
