import { useEffect, useState } from "react";
import { Doodle } from "./Doodle.jsx";
import {
  doodleTiming,
  resolveAnimation,
  resolveStages,
} from "./doodleTiming.js";
import { useDoodleTrigger } from "./useDoodleTrigger.js";

/**
 * Reusable animated doodle.
 *
 * @example
 * <AnimatedDoodle type="hammer" animation="forge" trigger="viewport" />
 * <AnimatedDoodle type="certificate" animation="stamp" trigger="success" active />
 */
export function AnimatedDoodle({
  type = "circle",
  animation = "draw",
  trigger = "viewport",
  stages,
  active = false,
  once = true,
  size = 32,
  variant = "ink",
  strokeWidth = 1.7,
  className = "",
  delay = 0,
  title = "",
  loop = false,
  onComplete,
} = {}) {
  const sequence = resolveStages(animation, stages);
  const { ref, playing, reduced, handlers } = useDoodleTrigger(trigger, {
    once: once && !loop,
    active,
  });
  const [stageIndex, setStageIndex] = useState(0);
  const [runKey, setRunKey] = useState(0);

  const stageKey = sequence.join("|");

  useEffect(() => {
    if (!playing) {
      setStageIndex(0);
      return undefined;
    }
    if (reduced) {
      setStageIndex(sequence.length - 1);
      onComplete?.();
      return undefined;
    }

    let cancelled = false;
    let timer;
    setStageIndex(0);
    setRunKey((key) => key + 1);

    function advance(index) {
      if (cancelled) return;
      const name = sequence[index] || "draw";
      const meta = resolveAnimation(name);
      const wait = Math.max(meta.duration, doodleTiming.quick) + (index === 0 ? delay : 0);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        if (index >= sequence.length - 1) {
          onComplete?.();
          if (loop) {
            setStageIndex(0);
            setRunKey((key) => key + 1);
            advance(0);
          }
          return;
        }
        setStageIndex(index + 1);
        advance(index + 1);
      }, wait);
    }

    advance(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // sequence captured via stageKey; onComplete is optional callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, reduced, stageKey, delay, loop]);

  const stageName = playing ? sequence[Math.min(stageIndex, sequence.length - 1)] : null;
  const stageMeta = stageName ? resolveAnimation(stageName) : null;
  const animClass = playing && stageMeta ? stageMeta.className : "";
  const settled = playing && (reduced || stageIndex >= sequence.length - 1);

  return (
    <span
      ref={ref}
      className={[
        "animated-doodle",
        playing ? "is-playing" : "is-idle",
        settled ? "is-settled" : "",
        animClass,
        loop ? "is-loop" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--doodle-delay": `${delay}ms`,
        "--doodle-duration": stageMeta
          ? `${stageMeta.duration}ms`
          : `${doodleTiming.draw}ms`,
      }}
      {...handlers}
    >
      <Doodle
        key={`${type}-${runKey}-${stageName || "idle"}`}
        type={type}
        size={size}
        variant={variant}
        strokeWidth={strokeWidth}
        title={title}
        animated={Boolean(playing && !reduced && ["draw", "write", "reveal", "connect", "stamp", "underline"].includes(stageName))}
        className={playing && !reduced ? "doodle-motion" : ""}
      />
    </span>
  );
}

export default AnimatedDoodle;
