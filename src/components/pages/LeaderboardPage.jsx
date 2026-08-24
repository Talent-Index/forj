import { useState } from "react";
import { TRACKS } from "../../data/learning.js";
import { LEADERBOARD_AUTHORITY, LEADERBOARD_DISCLAIMER } from "../../utils/progression/leaderboard.js";
import { useLiveLeaderboard } from "../../hooks/useLiveLeaderboard";
import { Button, Card } from "../ui/primitives";

function statusCopy(status) {
  if (status === "live") return "Live · append-only event log";
  if (status === "local") return "Offline preview · this device only";
  return "Connecting to the live board…";
}

function LeaderboardPage({ learnerId, progression, onToggleOptIn, onLearn }) {
  const [windowName, setWindowName] = useState("global");
  const [trackId, setTrackId] = useState(TRACKS[0].id);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const optedIn = Boolean(progression?.state?.leaderboard?.optIn);
  const board = useLiveLeaderboard({
    progression,
    windowName,
    trackId,
    enabled: true,
  });

  async function toggleOptIn() {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await onToggleOptIn(!optedIn);
      if (result && result.ok === false) {
        setActionError(result.error || "Could not update the board.");
      }
    } catch (error) {
      setActionError(error.message || "Could not update the board.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Leaderboard</p>
        <h1>Learner ranking</h1>
        <p className="lede">{LEADERBOARD_DISCLAIMER}</p>
        <p className="meta-line">{statusCopy(board.status)}</p>
      </header>

      <section className="section-block">
        <h2>Privacy</h2>
        <p className="meta-line">
          You appear on the live board by default under your display name.
          Hide anytime. Rank is not a verified exam and not an issuer-attested credential.
        </p>
        {(actionError || board.error) && (
          <p className="auth-error" role="alert">{actionError || board.error}</p>
        )}
        <Button variant={optedIn ? "secondary" : "primary"} onClick={toggleOptIn} disabled={busy}>
          {busy ? "Saving…" : optedIn ? "Hide me from the board" : "Show me on the live board"}
        </Button>
      </section>

      <div className="quiz-nav">
        <Button variant={windowName === "global" ? "primary" : "secondary"} onClick={() => setWindowName("global")}>Global</Button>
        <Button variant={windowName === "weekly" ? "primary" : "secondary"} onClick={() => setWindowName("weekly")}>Weekly</Button>
        <Button variant={windowName === "track" ? "primary" : "secondary"} onClick={() => setWindowName("track")}>Track</Button>
      </div>
      {windowName === "track" && (
        <label className="field">
          <span>Track</span>
          <select value={trackId} onChange={(event) => setTrackId(event.target.value)}>
            {TRACKS.map((track) => (
              <option key={track.id} value={track.id}>{track.name}</option>
            ))}
          </select>
        </label>
      )}

      <section className="section-block">
        {board.rows.length === 0 ? (
          <p className="meta-line">
            {board.status === "connecting"
              ? "Loading signed-in learners who opted in…"
              : "No opted-in learners on the live board yet."}
          </p>
        ) : (
          <ol className="leaderboard-list">
            {board.rows.map((row) => (
              <li key={row.learnerId} className={row.learnerId === learnerId ? "is-you" : ""}>
                <Card>
                  <p className="kicker">#{row.rank} {row.learnerId === learnerId ? "You" : row.displayName}</p>
                  <p className="stat-value">{windowName === "weekly" ? row.weeklyXp ?? 0 : row.xp} XP</p>
                  <p className="meta-line">Level {row.level} · {row.achievementCount} achievements · {row.completionPercent}% path</p>
                  {row.authority === LEADERBOARD_AUTHORITY.localPreview && (
                    <p className="note">Local fallback for this row.</p>
                  )}
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
      <Button variant="secondary" onClick={onLearn}>Back to Learn</Button>
    </div>
  );
}

export default LeaderboardPage;
