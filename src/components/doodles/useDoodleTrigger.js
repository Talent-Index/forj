import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion.js";

/**
 * Controls when a doodle animation should play.
 * @param {"viewport"|"hover"|"click"|"success"|"achievement"|"levelUp"|"completion"|"loading"|"manual"|"immediate"} trigger
 * @param {{ once?: boolean, active?: boolean, rootMargin?: string, threshold?: number }} options
 */
export function useDoodleTrigger(trigger = "viewport", options = {}) {
  const {
    once = true,
    active = false,
    rootMargin = "0px 0px -8% 0px",
    threshold = 0.35,
  } = options;
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const playedRef = useRef(false);
  const [playing, setPlaying] = useState(trigger === "immediate" || reduced);

  const play = useCallback(() => {
    if (once && playedRef.current && !reduced) return;
    playedRef.current = true;
    setPlaying(true);
  }, [once, reduced]);

  const reset = useCallback(() => {
    playedRef.current = false;
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (reduced) {
      setPlaying(true);
      return undefined;
    }

    if (trigger === "immediate" || trigger === "loading") {
      setPlaying(true);
      return undefined;
    }

    if (
      trigger === "manual" ||
      trigger === "success" ||
      trigger === "achievement" ||
      trigger === "levelUp" ||
      trigger === "completion"
    ) {
      if (active) play();
      else if (!once) setPlaying(false);
      return undefined;
    }

    if (trigger === "viewport") {
      const node = ref.current;
      if (!node || typeof IntersectionObserver === "undefined") {
        setPlaying(true);
        return undefined;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              play();
              if (once) observer.disconnect();
            }
          });
        },
        { rootMargin, threshold }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }

    return undefined;
  }, [trigger, active, once, play, reduced, rootMargin, threshold]);

  const hoverHandlers =
    trigger === "hover"
      ? {
          onMouseEnter: () => {
            if (reduced) return;
            setPlaying(false);
            requestAnimationFrame(() => setPlaying(true));
          },
        }
      : {};

  const clickHandlers =
    trigger === "click"
      ? {
          onClick: () => {
            if (reduced) return;
            setPlaying(false);
            requestAnimationFrame(() => play());
          },
        }
      : {};

  return {
    ref,
    playing: reduced ? true : playing,
    reduced,
    play,
    reset,
    handlers: { ...hoverHandlers, ...clickHandlers },
  };
}
