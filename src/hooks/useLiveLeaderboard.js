import { useEffect, useRef, useState } from "react";
import {
  LEADERBOARD_AUTHORITY,
  rankLearners,
  snapshotFromProgression,
} from "../utils/progression/leaderboard";
import { listenLiveLeaderboard, fetchLiveLeaderboard } from "../utils/backend/leaderboardSync";

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
    let cancelled = false;
    setStatus("connecting");
    setError("");
    fetchLiveLeaderboard()
      .then((next) => {
        if (cancelled) return;
        setRows(next);
        setStatus("live");
      })
      .catch((err) => {
        if (cancelled) return;
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
      });
    const unsub = listenLiveLeaderboard(
      (next) => {
        if (cancelled) return;
        setRows(next);
        setStatus("live");
        setError("");
      },
      (err) => {
        if (cancelled) return;
        setRows((current) => {
          if (current.length > 0) return current;
          const state = stateRef.current;
          if (!state?.leaderboard?.optIn) return current;
          return [
            snapshotFromProgression(state, {
              displayName: state.leaderboard.displayName,
              authority: LEADERBOARD_AUTHORITY.localPreview,
            }),
          ];
        });
        setStatus((current) => (current === "live" ? current : "local"));
        setError((current) => current || err?.message || "Could not load the live board.");
      }
    );
    return () => {
      cancelled = true;
      unsub();
    };
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
