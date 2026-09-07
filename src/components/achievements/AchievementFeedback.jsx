import { useState, useEffect } from "react";
import { AchievementUnlock } from "./AchievementUnlock";
import { ACHIEVEMENT_REGISTRY } from "../../utils/achievements";

/**
 * Thin bridge: when progression feedback includes achievements, show unlock card.
 */
export function AchievementFeedback({ feedback = [], onDismiss, onView }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const hit = (feedback || []).find((item) => item.kind === "achievement");
    if (!hit) {
      setActive(null);
      return;
    }
    const definition = ACHIEVEMENT_REGISTRY.find((row) => row.id === hit.id) || {
      id: hit.id,
      name: hit.name,
    };
    setActive(definition);
  }, [feedback]);

  if (!active) return null;

  return (
    <AchievementUnlock
      achievement={active}
      onDismiss={() => {
        setActive(null);
        onDismiss?.();
      }}
      onView={() => {
        onView?.(active);
        onDismiss?.();
      }}
    />
  );
}

export default AchievementFeedback;
