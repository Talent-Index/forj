import { TOTAL_PIECES } from "../data/questions.js";
import { TRACKS } from "../data/learning.js";
import { FORGE_LEVEL_META } from "./quizConfig.js";
import {
  describeAllTrackCertificates,
} from "./trackCertificates.js";
import {
  evaluateLearningCertificates,
  requirementMet,
} from "./achievements.js";
import { resolveCredentialStatus } from "./credentialStatus.js";

export const VAULT_STATES = Object.freeze(["earned", "in-progress", "locked"]);

export const VAULT_FILTERS = Object.freeze([
  { id: "all", label: "All" },
  { id: "claimed", label: "Claimed" },
  { id: "attested", label: "Issuer-attested" },
  { id: "in-progress", label: "In progress" },
  { id: "locked", label: "Locked" },
  { id: "Foundation", label: "Foundation" },
  { id: "Builder", label: "Builder" },
  { id: "Advanced", label: "Advanced" },
  { id: "Specialist", label: "Specialist" },
  { id: "Master", label: "Master" },
  { id: "Mastery", label: "Mastery" },
]);

export const VAULT_SORTS = Object.freeze([
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "highest", label: "Highest level" },
  { id: "recent-issued", label: "Recently issued" },
]);

const LEVEL_RANK = Object.freeze({
  Foundation: 1,
  Builder: 2,
  Advanced: 3,
  Specialist: 4,
  Master: 5,
  Mastery: 5,
});

const TRACK_LEVEL = Object.freeze({
  beginner: "Foundation",
  intermediate: "Builder",
  advanced: "Advanced",
});

function levelRank(level) {
  return LEVEL_RANK[level] || 0;
}

function learningState(cert, ctx) {
  if (cert.earned) return "earned";
  const parts = cert.requirement?.type === "allOf" ? cert.requirement.all || [] : [cert.requirement].filter(Boolean);
  if (!parts.length) return "locked";
  const met = parts.filter((part) => requirementMet(part, ctx)).length;
  if (met > 0) return "in-progress";
  return "locked";
}

function learningProgress(cert, ctx) {
  const parts = cert.requirement?.type === "allOf" ? cert.requirement.all || [] : [cert.requirement].filter(Boolean);
  if (!parts.length) return { current: cert.earned ? 1 : 0, target: 1, percent: cert.earned ? 100 : 0 };
  const met = parts.filter((part) => requirementMet(part, ctx)).length;
  const target = parts.length;
  return {
    current: met,
    target,
    percent: target ? Math.round((met / target) * 100) : 0,
    remaining: parts.filter((part) => !requirementMet(part, ctx)),
  };
}

function requirementLabel(part) {
  if (!part) return "Requirement";
  switch (part.type) {
    case "quizCompleted":
      return `Complete ${FORGE_LEVEL_META[part.quizId]?.forgeLabel || part.quizId} challenge`;
    case "perfectSection":
      return `Perfect ${FORGE_LEVEL_META[part.sectionId]?.forgeLabel || part.sectionId} assessment`;
    case "trackComplete": {
      const track = TRACKS.find((item) => item.id === part.trackId);
      return `Complete ${track?.name || part.trackId}`;
    }
    case "pathComplete":
      return "Complete the learning path";
    case "puzzleComplete":
      return "Collect all 16 puzzle pieces";
    case "puzzleCount":
      return `Collect ${part.min || 1} puzzle pieces`;
    case "credential":
      return "Mint a Fuji path credential";
    default:
      return part.type || "Requirement";
  }
}

function trackSkills(certificate, track) {
  if (Array.isArray(certificate.skills) && certificate.skills.length) return certificate.skills;
  if (Array.isArray(track?.skills) && track.skills.length) return track.skills;
  return [certificate.trackName || certificate.title || "Avalanche path"].filter(Boolean);
}

/**
 * Build a unified vault item list from track certs, learning certs, and optional Fuji path credential.
 */
export function buildVaultItems({
  acquiredPieces = [],
  sectionScores = {},
  progress = null,
  learningCtx = null,
  onChainCredential = null,
  puzzleComplete = false,
  pathLabel = "",
  recipientName = "",
  now = Date.now(),
} = {}) {
  const pieces = Array.isArray(acquiredPieces) ? acquiredPieces : [];
  const puzzleDone = puzzleComplete || pieces.length >= TOTAL_PIECES;
  const ctx = learningCtx || {
    completedQuizzes: progress?.completedQuizzes || {},
    sectionScores: sectionScores || {},
    puzzleCount: pieces.length,
    puzzleComplete: puzzleDone,
    hasCredential: Boolean(onChainCredential),
    completedTracks: progress?.completedTracks || {},
    completedPaths: progress?.completedPaths || {},
  };

  const trackItems = describeAllTrackCertificates({
    acquiredPieces: pieces,
    sectionScores,
    progress: progress || {},
    completedTracks: progress?.completedTracks || {},
  }).map((cert) => {
    const track = TRACKS.find((item) => item.id === cert.trackId);
    const state = cert.achieved ? "earned" : cert.unlocked ? "in-progress" : "locked";
    const percent = cert.kind === "quiz"
      ? (cert.needed ? Math.round((cert.seated / cert.needed) * 100) : 0)
      : Number(cert.trackPercent) || 0;
    return {
      id: `track:${cert.id}`,
      sourceId: cert.id,
      kind: "track",
      state,
      name: cert.title || cert.trackName,
      track: cert.trackName || track?.name || "",
      level: TRACK_LEVEL[track?.difficulty] || "Builder",
      skills: trackSkills(cert, track),
      progress: {
        current: cert.kind === "quiz" ? cert.seated : Math.round(((percent || 0) / 100) * 100),
        target: cert.kind === "quiz" ? cert.needed : 100,
        percent,
        seated: cert.seated,
        needed: cert.needed,
      },
      evidence: cert.kind === "quiz"
        ? [`${cert.seated} / ${cert.needed} puzzle pieces seated`]
        : [`Track progress ${percent}%`],
      requirements: state === "locked"
        ? ["Unlock this track on the learning path", ...(cert.kind === "quiz" ? [`Seat ${cert.needed} pieces`] : ["Complete the track"])]
        : state === "in-progress"
          ? (cert.kind === "quiz"
            ? [`Seat remaining pieces (${cert.seated}/${cert.needed})`]
            : ["Finish remaining lessons and challenges"])
          : [],
      issuedAt: state === "earned" ? now : null,
      issuedLabel: state === "earned" ? "Earned on path" : "",
      credentialId: state === "earned" ? `TRACK-${String(cert.id).toUpperCase()}` : null,
      statusId: "none",
      onChain: false,
      raw: cert,
    };
  });

  const learningCerts = evaluateLearningCertificates(ctx, {
    now,
    recipientName: recipientName || "LOCAL",
  });
  const learningItems = learningCerts.map((cert) => {
    const state = learningState(cert, ctx);
    const progressRow = learningProgress(cert, ctx);
    return {
      id: `learning:${cert.id}`,
      sourceId: cert.id,
      kind: "learning",
      state,
      name: cert.title,
      track: "Learning path",
      level: cert.level,
      skills: [...(cert.skills || [])],
      progress: progressRow,
      evidence: (cert.skills || []).map((skill) => skill),
      requirements: (progressRow.remaining || []).map(requirementLabel),
      issuedAt: state === "earned" ? now : null,
      issuedLabel: cert.issuedLabel || "",
      credentialId: cert.credentialId || null,
      statusId: "none",
      onChain: false,
      raw: cert,
    };
  });

  const pathItems = [];
  const status = resolveCredentialStatus(onChainCredential);
  if (onChainCredential) {
    pathItems.push({
      id: "path:fuji",
      sourceId: "path",
      kind: "path",
      state: "earned",
      name: pathLabel || "Avalanche Developer Path",
      track: "Path credential",
      level: "Mastery",
      skills: ["Claimed path scores", "Puzzle completion", "Fuji soulbound record"],
      progress: { current: TOTAL_PIECES, target: TOTAL_PIECES, percent: 100 },
      evidence: [
        `${onChainCredential.score?.totalPoints ?? ""} path points`.trim(),
        "Sixteen puzzle pieces",
        status.label,
      ].filter(Boolean),
      requirements: [],
      issuedAt: onChainCredential.mintedAt || now,
      issuedLabel: "On-chain Fuji record",
      credentialId: onChainCredential.credentialId
        ? `#${onChainCredential.credentialId}`
        : null,
      statusId: status.id,
      onChain: true,
      tokenId: onChainCredential.credentialId ? String(onChainCredential.credentialId) : "",
      raw: onChainCredential,
    });
  } else if (puzzleDone) {
    pathItems.push({
      id: "path:ready",
      sourceId: "path",
      kind: "path",
      state: "in-progress",
      name: pathLabel || "Avalanche Developer Path",
      track: "Path credential",
      level: "Mastery",
      skills: ["Path snapshot", "Claimed Fuji mint"],
      progress: { current: pieces.length, target: TOTAL_PIECES, percent: 100 },
      evidence: ["Puzzle complete", "Optional claimed Fuji mint ready"],
      requirements: ["Name the recipient", "Mint a Forjora claimed credential on Fuji"],
      issuedAt: null,
      issuedLabel: "",
      credentialId: null,
      statusId: "none",
      onChain: false,
      tokenId: "",
      raw: null,
    });
  } else {
    pathItems.push({
      id: "path:locked",
      sourceId: "path",
      kind: "path",
      state: "locked",
      name: pathLabel || "Avalanche Developer Path",
      track: "Path credential",
      level: "Mastery",
      skills: ["Path snapshot", "Claimed Fuji mint"],
      progress: {
        current: pieces.length,
        target: TOTAL_PIECES,
        percent: Math.round((pieces.length / TOTAL_PIECES) * 100),
      },
      evidence: [`${pieces.length} / ${TOTAL_PIECES} puzzle pieces`],
      requirements: [
        `Collect all ${TOTAL_PIECES} puzzle pieces`,
        "Complete path challenges",
      ],
      issuedAt: null,
      issuedLabel: "",
      credentialId: null,
      statusId: "none",
      onChain: false,
      tokenId: "",
      raw: null,
    });
  }

  return [...learningItems, ...trackItems, ...pathItems];
}

export function vaultStats(items = [], { acquiredPieces = [], puzzleComplete = false } = {}) {
  const earned = items.filter((item) => item.state === "earned");
  const attested = items.filter((item) => item.statusId === "attested");
  const claimed = items.filter((item) => item.statusId === "claimed");
  const skills = new Set();
  for (const item of earned) {
    for (const skill of item.skills || []) skills.add(skill);
  }
  let highest = "";
  let highestRank = 0;
  for (const item of earned) {
    const rank = levelRank(item.level);
    if (rank >= highestRank) {
      highestRank = rank;
      highest = item.level;
    }
  }
  const pieces = Array.isArray(acquiredPieces) ? acquiredPieces.length : 0;
  return {
    credentialsEarned: earned.length,
    attestedCount: attested.length,
    claimedCount: claimed.length,
    skillsCount: skills.size,
    highestLevel: highest || "—",
    puzzlePieces: pieces,
    puzzleTotal: TOTAL_PIECES,
    puzzleComplete: puzzleComplete || pieces >= TOTAL_PIECES,
    inProgressCount: items.filter((item) => item.state === "in-progress").length,
    lockedCount: items.filter((item) => item.state === "locked").length,
  };
}

export function selectFeaturedCredential(items = []) {
  const earned = items.filter((item) => item.state === "earned");
  const path = earned.find((item) => item.kind === "path" && item.onChain);
  if (path) return path;
  const learning = earned
    .filter((item) => item.kind === "learning")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));
  if (learning[0]) return learning[0];
  const tracks = earned
    .filter((item) => item.kind === "track")
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));
  return tracks[0] || null;
}

export function filterVaultItems(items = [], filterId = "all") {
  if (!filterId || filterId === "all") return items;
  if (filterId === "claimed") return items.filter((item) => item.statusId === "claimed");
  if (filterId === "attested") return items.filter((item) => item.statusId === "attested");
  if (filterId === "in-progress") return items.filter((item) => item.state === "in-progress");
  if (filterId === "locked") return items.filter((item) => item.state === "locked");
  if (filterId === "Mastery") {
    return items.filter((item) => item.level === "Mastery" || item.level === "Master");
  }
  return items.filter((item) => item.level === filterId);
}

export function sortVaultItems(items = [], sortId = "newest") {
  const list = [...items];
  const issued = (item) => Number(item.issuedAt) || 0;
  switch (sortId) {
    case "oldest":
      return list.sort((a, b) => {
        if (a.state === "earned" && b.state !== "earned") return -1;
        if (b.state === "earned" && a.state !== "earned") return 1;
        return issued(a) - issued(b) || a.name.localeCompare(b.name);
      });
    case "highest":
      return list.sort(
        (a, b) => levelRank(b.level) - levelRank(a.level) || a.name.localeCompare(b.name)
      );
    case "recent-issued":
      return list.sort((a, b) => issued(b) - issued(a) || a.name.localeCompare(b.name));
    case "newest":
    default:
      return list.sort((a, b) => {
        const stateRank = { earned: 0, "in-progress": 1, locked: 2 };
        const sr = (stateRank[a.state] ?? 9) - (stateRank[b.state] ?? 9);
        if (sr !== 0) return sr;
        return levelRank(b.level) - levelRank(a.level) || a.name.localeCompare(b.name);
      });
  }
}

export function buildCredentialVault(input = {}) {
  const items = buildVaultItems(input);
  const stats = vaultStats(items, input);
  const featured = selectFeaturedCredential(items);
  return { items, stats, featured };
}

export { levelRank };
