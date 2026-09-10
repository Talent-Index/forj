import { useEffect, useState } from "react";
import { LEADERBOARD_DISCLAIMER } from "../../utils/progression/leaderboard.js";
import { fetchPublicProfileBySlug } from "../../utils/backend/leaderboardSync.js";
import { Button, Card } from "../ui/primitives";

function PublicProfilePage({ slug, onBoard, onHome, onSignIn, isAuthenticated }) {
  const [status, setStatus] = useState("loading");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError("");
    setProfile(null);
    fetchPublicProfileBySlug(slug)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setStatus("missing");
          return;
        }
        setProfile(row);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Could not load this profile.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Learner</p>
        <h1>{profile?.displayName || "Public profile"}</h1>
        <p className="lede">{LEADERBOARD_DISCLAIMER}</p>
      </header>

      {status === "loading" && <p className="meta-line">Loading…</p>}
      {status === "error" && <p className="auth-error" role="alert">{error}</p>}
      {status === "missing" && (
        <Card>
          <p className="meta-line">This learner is not on the public board, or the link is unknown.</p>
        </Card>
      )}
      {status === "ready" && profile && (
        <section className="section-block">
          <Card>
            <p className="stat-value">{profile.xp} XP</p>
            <p className="meta-line">
              Lv {profile.level} · {profile.achievementCount} achievements · {profile.completionPercent}% path
            </p>
            {profile.walletHint ? <p className="meta-line">{profile.walletHint}</p> : null}
            <p className="note">Community ranking · not issuer-attested · not on-chain</p>
          </Card>
        </section>
      )}

      <div className="page-actions">
        <Button variant="primary" onClick={onBoard}>Board</Button>
        <Button variant="secondary" onClick={onHome}>Home</Button>
        {!isAuthenticated && onSignIn ? (
          <Button variant="secondary" onClick={onSignIn}>Sign in</Button>
        ) : null}
      </div>
    </div>
  );
}

export default PublicProfilePage;
