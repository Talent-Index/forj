import { useMemo, useState } from "react";
import { TRACKS } from "../../data/learning.js";
import {
  LEADERBOARD_DISCLAIMER,
  rankLearners,
  readLeaderboard,
} from "../../utils/progression/leaderboard.js";
import { Button, Card } from "../ui/primitives";

function LeaderboardPage({ learnerId, progression, onToggleOptIn, onLearn }) {
  const [windowName, setWindowName] = useState("global");
  const [trackId, setTrackId] = useState(TRACKS[0].id);
  const optedIn = Boolean(progression?.state?.leaderboard?.optIn);
  const rows = useMemo(
    () => rankLearners(readLeaderboard(), {
      window: windowName,
      trackId: windowName === "track" ? trackId : undefined,
    }),
    [windowName, trackId, optedIn, progression?.state?.xp]
  );

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Leaderboard</p>
        <h1>Local ranking preview</h1>
        <p className="lede">{LEADERBOARD_DISCLAIMER}</p>
      </header>

      <section className="section-block">
        <h2>Privacy</h2>
        <p className="meta-line">
          Rankings on this device only. Opting in stores a display name and XP snapshot in localStorage, not a server.
        </p>
        <Button variant={optedIn ? "secondary" : "primary"} onClick={() => onToggleOptIn(!optedIn)}>
          {optedIn ? "Hide me from this board" : "Include me on this device"}
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
        {rows.length === 0 ? (
          <p className="meta-line">No opted-in learners on this device yet.</p>
        ) : (
          <ol className="leaderboard-list">
            {rows.map((row) => (
              <li key={row.learnerId} className={row.learnerId === learnerId ? "is-you" : ""}>
                <Card>
                  <p className="kicker">#{row.rank} {row.learnerId === learnerId ? "You" : row.displayName}</p>
                  <p className="stat-value">{windowName === "weekly" ? row.weeklyXp ?? 0 : row.xp} XP</p>
                  <p className="meta-line">Level {row.level} · {row.achievementCount} achievements · {row.completionPercent}% path</p>
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
