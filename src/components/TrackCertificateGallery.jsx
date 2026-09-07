import { PIECE_COST } from "../data/questions.js";
import { describeAllTrackCertificates } from "../utils/trackCertificates.js";
import { safeMediaSrc } from "../utils/frontendSecurity.js";
import { Button, Card, ProgressBar } from "./ui/primitives";
import { Doodle } from "./doodles";

const TRACK_DOODLE = {
  fundamentals: "book",
  architecture: "blueprint",
  l1s: "mountain",
  "c-chain": "contract",
  icm: "nodes",
  developer: "badge",
};

function statusLabel(status) {
  if (status === "achieved") return "Achieved";
  if (status === "in-progress") return "In progress";
  return "Locked";
}

function TrackCertificateCard({
  cert,
  recipientName,
  artwork,
  onForge,
  onLearn,
}) {
  const quizPercent = cert.quizId && cert.needed
    ? Math.round((cert.seated / cert.needed) * 100)
    : cert.trackPercent;
  const art = safeMediaSrc(artwork);
  const doodleType = TRACK_DOODLE[cert.trackId] || TRACK_DOODLE[cert.id] || "certificate";

  return (
    <Card className={`track-cert-card is-${cert.status}`}>
      <div className="track-cert-head">
        <span className="track-cert-icon" aria-hidden="true">
          <Doodle
            type={doodleType}
            size={18}
            variant={cert.achieved ? "accent" : "muted"}
            animated={Boolean(cert.achieved)}
          />
        </span>
        <p className="kicker">{statusLabel(cert.status)}</p>
      </div>

      {cert.achieved ? (
        <div className="track-cert-achieved">
          <div className="track-cert-art" aria-hidden={!art}>
            {art ? (
              <img src={art} alt="" />
            ) : (
              <div className="certificate-art-fallback" />
            )}
          </div>
          <h3>{cert.title}</h3>
          <p className="meta-line">{cert.trackName}</p>
          <p className="track-cert-recipient">{recipientName || "Learner"}</p>
          <p className="note">
            {cert.kind === "quiz"
              ? `${cert.needed} pieces seated · learning record`
              : "Track complete · learning record"}
          </p>
          <p className="meta-line">Not an on-chain mint</p>
        </div>
      ) : (
        <>
          <h3>{cert.title}</h3>
          <p className="meta-line">{cert.trackName}</p>
          {cert.kind === "quiz" ? (
            <>
              <ProgressBar
                label={`${cert.seated}/${cert.needed} pieces`}
                value={quizPercent}
              />
              <p className="meta-line">
                {cert.earned} pts · {cert.available} to spend · {PIECE_COST} each
              </p>
            </>
          ) : (
            <ProgressBar label={`${cert.trackPercent}% track`} value={cert.trackPercent} />
          )}
          <p className="note">
            {cert.kind === "quiz"
              ? "Quiz points seat this track’s pieces."
              : "Finish the track lessons to achieve this certificate."}
          </p>
        </>
      )}

      <div className="track-cert-actions">
        {cert.status === "locked" ? (
          <Button variant="secondary" disabled>Locked</Button>
        ) : cert.kind === "quiz" && !cert.achieved ? (
          <Button onClick={() => onForge?.(cert.id)}>{cert.seated ? "Forge" : "Start"}</Button>
        ) : cert.kind === "track" && !cert.achieved ? (
          <Button variant="secondary" onClick={onLearn}>Learn</Button>
        ) : null}
      </div>
    </Card>
  );
}

function TrackCertificateGallery({
  acquiredPieces,
  sectionScores,
  progress,
  recipientName,
  artwork,
  onForge,
  onLearn,
}) {
  const rows = describeAllTrackCertificates({
    acquiredPieces,
    sectionScores,
    progress,
    completedTracks: progress?.completedTracks,
  });
  const achieved = rows.filter((row) => row.status === "achieved");
  const open = rows.filter((row) => row.status !== "achieved");

  return (
    <>
      <section className="section-block track-cert-intro">
        <h2>Track certificates</h2>
        <p className="meta-line">
          Learning records for each path track. They are not extra Fuji tokens and sit beside
          Foundation → Master learning certificates above.
        </p>
      </section>
      {open.length > 0 && (
        <section className="section-block">
          <h2>In progress</h2>
          <div className="track-cert-grid">
            {open.map((cert) => (
              <TrackCertificateCard
                key={cert.id}
                cert={cert}
                recipientName={recipientName}
                artwork={artwork}
                onForge={onForge}
                onLearn={onLearn}
              />
            ))}
          </div>
        </section>
      )}
      {achieved.length > 0 && (
        <section className="section-block">
          <h2>Achieved</h2>
          <div className="track-cert-grid">
            {achieved.map((cert) => (
              <TrackCertificateCard
                key={cert.id}
                cert={cert}
                recipientName={recipientName}
                artwork={artwork}
                onForge={onForge}
                onLearn={onLearn}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default TrackCertificateGallery;
export { TrackCertificateCard };
