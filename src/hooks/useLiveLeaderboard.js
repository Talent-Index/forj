import { useEffect, useRef, useState } from "react";
import {
  LEADERBOARD_AUTHORITY,
  rankLearners,
  snapshotFromProgression,
} from "../utils/progression/leaderboard";
import { listenLiveLeaderboard } from "../utils/backend/leaderboardSync";

export function useLiveLeaderboard({ progression, windowName = "global", trackId, enabled = true } = {}) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const stateRef = useRef(progression?.state);

  useEffect(() => {
    stateRef.current = progression?.state;
  }, [progression?.state]);

  useEffect(() => {
    if (!enabled) {
      setStatus("local");
      return undefined;
    }
    setStatus("connecting");
    setError("");
    return listenLiveLeaderboard(
      (next) => {
        setRows(next);
        setStatus("live");
      },
      (err) => {
        setError(err?.message || "Could not load the live board.");
        setStatus("local");
        const state = stateRef.current;
        if (state?.leaderboard?.optIn) {
          setRows([
            snapshotFromProgression(state, {
              displayName: state.leaderboard.displayName,
              authority: LEADERBOARD_AUTHORITY.localPreview,
            }),
          ]);
        } else {
          setRows([]);
        }
      }
    );
  }, [enabled]);

  return {
    rows: rankLearners(rows, {
      window: windowName,
      trackId: windowName === "track" ? trackId : undefined,
    }),
    status,
    error,
    live: status === "live",
  };
}
