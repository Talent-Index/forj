import { useState } from "react";
import { TRACKS } from "../../data/learning.js";
import { LEADERBOARD_AUTHORITY, LEADERBOARD_DISCLAIMER } from "../../utils/progression/leaderboard.js";
import { useLiveLeaderboard } from "../../hooks/useLiveLeaderboard";
import { Button, Card } from "../ui/primitives";

function statusCopy(status) {
  if (status === "live") return "Live · community ranking";
  if (status === "local") return "Offline preview";
  return "Connecting…";
}

function profileHref(slug) {
  return slug ? `/u/${encodeURIComponent(slug)}` : "";
}

function LeaderboardPage({
  learnerId,
  progression,
  isAuthenticated = false,
  onToggleOptIn,
  onToggleHideWallet,
  onLearn,
  onSignIn,
  onOpenProfile,
}) {
  const [windowName, setWindowName] = useState("global");
  const [trackId, setTrackId] = useState(TRACKS[0].id);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const optedIn = Boolean(progression?.state?.leaderboard?.optIn);
  const hideWallet = progression?.state?.leaderboard?.hideWallet !== false;
  const displayName = progression?.state?.leaderboard?.displayName || "Learner";
  const board = useLiveLeaderboard({
    progression,
    windowName,
    trackId,
    enabled: true,
  });

  async function toggleOptIn() {
    if (busy || !isAuthenticated) return;
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

  async function toggleHideWallet() {
    if (busy || !isAuthenticated || !optedIn) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await onToggleHideWallet(!hideWallet);
      if (result && result.ok === false) {
        setActionError(result.error || "Could not update wallet visibility.");
      }
    } catch (error) {
      setActionError(error.message || "Could not update wallet visibility.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Community</p>
        <h1>Board</h1>
        <p className="lede">{LEADERBOARD_DISCLAIMER}</p>
        <p className="meta-line">{statusCopy(board.status)}</p>
      </header>

      <section className="board-visibility" aria-label="Board visibility">
        {(actionError || board.error) && (
          <p className="auth-error" role="alert">{actionError || board.error}</p>
        )}
        {isAuthenticated ? (
          <>
            <button
              type="button"
              className="board-visibility-row"
              role="switch"
              aria-checked={optedIn}
              aria-label={optedIn ? "Hide from the live board" : "Show on the live board"}
              aria-busy={busy}
              disabled={busy}
              onClick={toggleOptIn}
            >
              <span className="board-visibility-status">
                {busy ? "Saving…" : optedIn ? `Visible as ${displayName}` : "Hidden from the board"}
              </span>
              <span className="board-switch" aria-hidden="true" />
            </button>
            {optedIn && (
              <button
                type="button"
                className="board-visibility-row"
                role="switch"
                aria-checked={!hideWallet}
                aria-label={hideWallet ? "Show linked wallet on the board" : "Hide linked wallet on the board"}
                aria-busy={busy}
                disabled={busy}
                onClick={toggleHideWallet}
              >
                <span className="board-visibility-status">
                  {hideWallet ? "Wallet hidden on the board" : "Linked wallet shown on the board"}
                </span>
                <span className="board-switch" aria-hidden="true" />
              </button>
            )}
          </>
        ) : (
          <div className="board-visibility-row board-visibility-guest">
            <span className="board-visibility-status">
              Sign in to appear on the live board under your display name.
            </span>
            {onSignIn && (
              <Button variant="secondary" onClick={onSignIn}>Sign in</Button>
            )}
          </div>
        )}
      </section>

      <div className="page-actions quiz-nav">
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
              ? "Loading…"
              : optedIn
                ? "You are visible, but the live roster has not loaded yet. Check that Firestore rules are deployed, or refresh after learning activity syncs."
                : "No one on the board yet."}
          </p>
        ) : (
          <ol className="leaderboard-list">
            {board.rows.map((row) => {
              const isYou = Boolean(learnerId) && row.learnerId === learnerId;
              const href = profileHref(row.publicSlug);
              const name = isYou ? "You" : row.displayName;
              return (
                <li key={row.learnerId} className={isYou ? "is-you" : ""}>
                  <Card>
                    <p className="kicker">
                      #{row.rank}{" "}
                      {href ? (
                        <button
                          type="button"
                          className="board-profile-link"
                          onClick={() => onOpenProfile?.(row.publicSlug)}
                        >
                          {name}
                        </button>
                      ) : name}
                    </p>
                    <p className="stat-value">{windowName === "weekly" ? row.weeklyXp ?? 0 : row.xp} XP</p>
                    <p className="meta-line">Lv {row.level} · {row.achievementCount} · {row.completionPercent}%</p>
                    {row.walletHint ? (
                      <p className="meta-line">{row.walletHint}</p>
                    ) : null}
                    {row.authority === LEADERBOARD_AUTHORITY.localPreview && (
                      <p className="note">Local fallback for this row.</p>
                    )}
                    {row.authority === LEADERBOARD_AUTHORITY.xpLedger && (
                      <p className="note">Server ledger</p>
                    )}
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <Button variant="secondary" onClick={onLearn}>Learn</Button>
    </div>
  );
}

export default LeaderboardPage;
