/**
 * Presentation helpers for the Learn hub / track / lesson UX.
 * Derives display metadata from the existing catalog. no parallel curriculum.
 */

import { TRACKS, getLearningCatalog } from "../data/learning.js";
import {
  getTrackProgress,
  modulesForTrack,
  lessonsForModule,
} from "./progression/paths.js";

export const LEARN_CATEGORIES = Object.freeze([
  "All",
  "Blockchain",
  "Web3 Development",
  "Smart Contracts",
  "Ecosystems",
]);

/** Per-track doodle for hub cards, journeys, and certificates. */
export const TRACK_DOODLE = Object.freeze({
  fundamentals: "book",
  architecture: "blueprint",
  l1s: "mountain",
  "c-chain": "contract",
  icm: "nodes",
  developer: "badge",
  security: "shield",
});

/** Per-track display enrichment (skills + discovery tags). */
export const TRACK_PRESENTATION = Object.freeze({
  fundamentals: {
    category: ["Blockchain", "Ecosystems"],
    skills: ["Avalanche basics", "Primary Network", "AVAX"],
    estimatedMinutes: 45,
    doodle: TRACK_DOODLE.fundamentals,
  },
  architecture: {
    category: ["Blockchain", "Ecosystems"],
    skills: ["Snowman consensus", "Validators", "Chain roles"],
    estimatedMinutes: 55,
    doodle: TRACK_DOODLE.architecture,
  },
  l1s: {
    category: ["Ecosystems", "Blockchain"],
    skills: ["Avalanche L1s", "Validator sets", "Sovereignty"],
    estimatedMinutes: 40,
    doodle: TRACK_DOODLE.l1s,
  },
  "c-chain": {
    category: ["Smart Contracts", "Web3 Development"],
    skills: ["C-Chain", "EVM", "Smart contracts"],
    estimatedMinutes: 45,
    doodle: TRACK_DOODLE["c-chain"],
  },
  icm: {
    category: ["Web3 Development", "Blockchain"],
    skills: ["ICM", "Warp messaging", "Teleporter"],
    estimatedMinutes: 50,
    doodle: TRACK_DOODLE.icm,
  },
  developer: {
    category: ["Web3 Development", "Smart Contracts"],
    skills: ["Tooling", "Project lab", "Fuji practice", "Path capstone"],
    estimatedMinutes: 100,
    doodle: TRACK_DOODLE.developer,
  },
  security: {
    category: ["Web3 Development", "Blockchain"],
    skills: ["Threat awareness", "Key hygiene", "Operational safety"],
    estimatedMinutes: 40,
    doodle: TRACK_DOODLE.security,
  },
});

const DIFFICULTY_LABEL = Object.freeze({
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
});

export function formatDifficulty(value) {
  return DIFFICULTY_LABEL[value] || value || "Beginner";
}

export function formatDuration(minutes) {
  if (!minutes || minutes < 60) return `${minutes || 30} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/**
 * Aggregate counts for a track card / track header.
 */
export function describeTrackCounts(trackId, catalog = getLearningCatalog()) {
  const modules = modulesForTrack(trackId, catalog);
  let lessons = 0;
  let challenges = 0;
  modules.forEach((module) => {
    lessons += (module.lessonIds || []).length;
    if (module.quizId) challenges += 1;
  });
  return {
    modules: modules.length,
    lessons,
    challenges,
  };
}

export function describeTrackCard(track, progress, presentation = TRACK_PRESENTATION[track.id]) {
  const counts = describeTrackCounts(track.id);
  const meta = presentation || { category: ["Blockchain"], skills: [], estimatedMinutes: 40 };
  const started = progress.percent > 0 && !progress.complete;
  return {
    id: track.id,
    name: track.name,
    description: track.description,
    difficulty: formatDifficulty(track.difficulty),
    difficultyId: track.difficulty,
    doodle: meta.doodle || TRACK_DOODLE[track.id] || "book",
    categories: meta.category || [],
    skills: meta.skills || [],
    estimatedMinutes: meta.estimatedMinutes || 40,
    durationLabel: formatDuration(meta.estimatedMinutes),
    modules: counts.modules,
    lessons: counts.lessons,
    challenges: counts.challenges,
    percent: progress.percent ?? 0,
    unlocked: Boolean(progress.unlocked),
    complete: Boolean(progress.complete),
    started,
    cta: progress.complete
      ? "Review track"
      : started
        ? "Continue learning"
        : progress.unlocked
          ? "Start track"
          : "Locked",
  };
}

export function listTrackCards(progressState, category = "All") {
  return TRACKS.map((track) => {
    const progress = getTrackProgress(progressState || {}, track.id);
    return describeTrackCard(track, progress);
  }).filter((card) => category === "All" || card.categories.includes(category));
}

/**
 * Vertical journey steps for a track: modules + optional credential capstone.
 */
export function buildTrackJourney(trackProgress) {
  if (!trackProgress?.modules) return [];
  const steps = trackProgress.modules.map((module, index) => {
    const lessonCount = module.lessons?.length || 0;
    const challengeCount = module.quizId ? 1 : 0;
    let status = "locked";
    if (module.complete) status = "completed";
    else if (module.unlocked) {
      const inProgress = module.percent > 0;
      status = inProgress ? "current" : "available";
    }
    const isQuizOnly = Boolean(module.quizId) && lessonCount === 0;
    const isProjectLab = /project/i.test(module.id) || /project lab/i.test(module.name || "");
    const kind = isQuizOnly ? "challenge" : isProjectLab ? "project" : "module";
    return {
      id: module.id,
      index: index + 1,
      title: module.name,
      status,
      percent: module.percent,
      lessonCount,
      challengeCount,
      quizId: module.quizId || null,
      lessons: module.lessons || [],
      kind,
      summary: isQuizOnly
        ? `1 Challenge`
        : [
            isProjectLab ? "Project lab" : null,
            lessonCount ? `${lessonCount} Lesson${lessonCount === 1 ? "" : "s"}` : null,
            challengeCount ? `${challengeCount} Challenge` : null,
          ]
            .filter(Boolean)
            .join(" · "),
    };
  });

  const credentialStatus = trackProgress.complete
    ? "completed"
    : trackProgress.unlocked && trackProgress.percent >= 100
      ? "available"
      : trackProgress.unlocked
        ? "locked"
        : "locked";

  steps.push({
    id: `${trackProgress.id}-credential`,
    index: steps.length + 1,
    title: "Credential",
    status: trackProgress.complete ? "completed" : credentialStatus,
    percent: trackProgress.complete ? 100 : 0,
    lessonCount: 0,
    challengeCount: 0,
    quizId: null,
    lessons: [],
    kind: "credential",
    summary: trackProgress.complete
      ? "Track certificate achieved"
      : "Earn your Forjora track credential",
  });

  return steps;
}

export function skillsFromPath(progressState) {
  return TRACKS.map((track) => {
    const progress = getTrackProgress(progressState || {}, track.id);
    const skills = TRACK_PRESENTATION[track.id]?.skills || [];
    return {
      trackId: track.id,
      name: track.name,
      percent: progress.percent ?? 0,
      complete: Boolean(progress.complete),
      skills,
    };
  });
}

export function lessonContext(lessonId, progressState, catalog = getLearningCatalog()) {
  const lesson = catalog.lessonById[lessonId];
  if (!lesson) return null;
  const module = catalog.moduleById[lesson.moduleId];
  const track = module ? catalog.trackById[module.trackId] : null;
  const trackProgress = track ? getTrackProgress(progressState || {}, track.id) : null;
  const moduleProgress = trackProgress?.modules?.find((item) => item.id === module?.id) || null;
  const siblings = module ? lessonsForModule(module.id, catalog) : [];
  const index = siblings.findIndex((item) => item.id === lessonId);
  return {
    lesson,
    module,
    track,
    trackProgress,
    moduleProgress,
    siblings,
    lessonIndex: index + 1,
    lessonTotal: siblings.length,
  };
}

export { lessonsForModule, modulesForTrack };
