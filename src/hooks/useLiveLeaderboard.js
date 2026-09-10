import { useEffect, useRef, useState } from "react";
import {
  LEADERBOARD_AUTHORITY,
  rankLearners,
  snapshotFromProgression,
} from "../utils/progression/leaderboard";
import { listenLiveLeaderboard, fetchLiveLeaderboard } from "../utils/backend/leaderboardSync";

function withLocalOptIn(rows, state) {
  if (!state?.leaderboard?.optIn || !state.learnerId) return rows || [];
  const list = Array.isArray(rows) ? rows.slice() : [];
  if (list.some((row) => row.learnerId === state.learnerId)) return list;
  list.push(snapshotFromProgression(state, {
    displayName: state.leaderboard.displayName,
    publicSlug: state.leaderboard.publicSlug || "",
    walletHint: state.leaderboard.hideWallet === false ? (state.leaderboard.walletHint || "") : "",
    authority: LEADERBOARD_AUTHORITY.localPreview,
  }));
  return list;
}

export function useLiveLeaderboard({ progression, windowName = "global", trackId, enabled = true } = {}) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const stateRef = useRef(progression?.state);

  useEffect(() => {
    stateRef.current = progression?.state;
    setRows((current) => withLocalOptIn(current, progression?.state));
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
        setRows(withLocalOptIn(next, stateRef.current));
        setStatus("live");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Could not load the live board.");
        setStatus("local");
        setRows(withLocalOptIn([], stateRef.current));
      });
    const unsub = listenLiveLeaderboard(
      (next) => {
        if (cancelled) return;
        setRows(withLocalOptIn(next, stateRef.current));
        setStatus("live");
        setError("");
      },
      (err) => {
        if (cancelled) return;
        setRows((current) => {
          if (current.length > 0) return withLocalOptIn(current, stateRef.current);
          return withLocalOptIn([], stateRef.current);
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
