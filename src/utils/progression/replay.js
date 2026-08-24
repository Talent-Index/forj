import { EVENT_TYPES } from "./events.js";
import { applyProgressEvent, emptyProgression } from "./engine.js";

export function replayEvents(userId, events, extras = {}) {
  let state = emptyProgression(userId);
  const ordered = (events || []).slice().sort(
    (a, b) => Number(a.clientTimestamp ?? a.timestamp ?? 0) - Number(b.clientTimestamp ?? b.timestamp ?? 0)
  );
  for (const raw of ordered) {
    const type = raw.type;
    if (!EVENT_TYPES[type]) continue;
    state = applyProgressEvent(state, {
      type,
      sourceId: raw.sourceId,
      learnerId: userId,
      timestamp: raw.clientTimestamp ?? raw.timestamp,
      metadata: raw.metadata,
    }, extras).state;
  }
  return state;
}
