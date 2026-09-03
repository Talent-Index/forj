import { PIECE_COST } from "../data/questions.js";
import { describeAllTrackCertificates } from "../utils/trackCertificates.js";
import { Icon } from "./ui/Icon";
import { Button, Card, ProgressBar } from "./ui/primitives";
import CertificateArtifact from "./CertificateArtifact";

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
  return (
    <Card className={`track-cert-card is-${cert.status}`}>
      <p className="kicker">
        <Icon name={cert.icon} size={14} />
        {statusLabel(cert.status)}
      </p>
      {cert.achieved ? (
        <CertificateArtifact
          compact
          artwork={artwork}
          recipientName={recipientName}
          scorePercent={cert.kind === "quiz" ? 100 : cert.trackPercent}
          difficulty={cert.quizLabel || "Track"}
          credentialId={`FJ-${cert.id.toUpperCase()}`}
          pathLabel={cert.title}
        />
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
