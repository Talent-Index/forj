import { useEffect, useState } from "react";

/** Reads Forjora motion choice, with system preference only when choice is system. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return readReduced();
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setReduced(readReduced(mq.matches));
    }
    sync();
    mq.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduced-motion", "data-motion-choice"],
    });
    return () => {
      mq.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  return reduced;
}

function readReduced(mediaMatches) {
  const choice = document.documentElement.dataset.motionChoice || "system";
  if (choice === "full") return false;
  if (choice === "reduced") return true;
  const flag = document.documentElement.dataset.reducedMotion === "true";
  if (typeof mediaMatches === "boolean") return flag || mediaMatches;
  return flag || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
