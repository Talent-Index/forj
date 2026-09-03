import { PIECE_COST } from "../data/questions.js";
import { TRACK_CERTIFICATES, TRACKS } from "../data/learning.js";
import { isTrackUnlocked, getTrackProgress } from "./progression/paths.js";
import { normalizePieces } from "./puzzle.js";

export { TRACK_CERTIFICATES };

export function certificateById(id) {
  return TRACK_CERTIFICATES.find((item) => item.id === id) || null;
}

export function certificateForPiece(index) {
  return TRACK_CERTIFICATES.find((item) => item.pieceIndexes.includes(index)) || null;
}

export function quizPointsEarned(sectionScores = {}, quizId) {
  if (!quizId) return 0;
  return Math.max(0, Number(sectionScores[quizId]?.pointsEarned) || 0);
}

export function seatedOnCertificate(acquiredPieces, certificate) {
  const seated = new Set(normalizePieces(acquiredPieces));
  return (certificate.pieceIndexes || []).filter((index) => seated.has(index)).length;
}

export function spentOnCertificate(acquiredPieces, certificate) {
  return seatedOnCertificate(acquiredPieces, certificate) * PIECE_COST;
}

export function availableOnCertificate(sectionScores, acquiredPieces, certificate) {
  if (!certificate?.quizId) return 0;
  return Math.max(
    0,
    quizPointsEarned(sectionScores, certificate.quizId) - spentOnCertificate(acquiredPieces, certificate)
  );
}

export function certificateAchieved(certificate, { acquiredPieces = [], completedTracks = {} } = {}) {
  if (certificate.kind === "track") {
    return Boolean(completedTracks[certificate.trackId]);
  }
  const needed = certificate.pieceIndexes.length;
  return needed > 0 && seatedOnCertificate(acquiredPieces, certificate) >= needed;
}

export function describeTrackCertificate(certificate, ctx = {}) {
  const track = TRACKS.find((item) => item.id === certificate.trackId);
  const unlocked = Boolean(ctx.forceUnlocked) || isTrackUnlocked(ctx.progress || {}, certificate.trackId);
  const trackProgress = getTrackProgress(ctx.progress || {}, certificate.trackId);
  const achieved = certificateAchieved(certificate, ctx);
  const seated = seatedOnCertificate(ctx.acquiredPieces, certificate);
  const needed = certificate.pieceIndexes.length;
  const earned = quizPointsEarned(ctx.sectionScores, certificate.quizId);
  const available = availableOnCertificate(ctx.sectionScores, ctx.acquiredPieces, certificate);
  let status = "locked";
  if (achieved) status = "achieved";
  else if (unlocked) status = "in-progress";
  return {
    ...certificate,
    trackName: track?.name || certificate.title,
    status,
    unlocked,
    achieved,
    seated,
    needed,
    earned,
    available,
    trackPercent: trackProgress.percent,
  };
}

export function describeAllTrackCertificates(ctx = {}) {
  return TRACK_CERTIFICATES.map((certificate) => describeTrackCertificate(certificate, ctx));
}

export function quizCertificatesComplete(acquiredPieces) {
  return TRACK_CERTIFICATES
    .filter((item) => item.kind === "quiz")
    .every((item) => certificateAchieved(item, { acquiredPieces }));
}
