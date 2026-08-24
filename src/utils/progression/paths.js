import { LEARNING_CATALOG, QUIZ_MODULE_IDS } from "../../data/learning.js";

function asRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

export function getCatalog(catalog = LEARNING_CATALOG) {
  return catalog || LEARNING_CATALOG;
}

export function getPath(pathId, catalog = LEARNING_CATALOG) {
  const data = getCatalog(catalog);
  return data.pathById[pathId] || data.pathById[data.defaultPathId] || data.paths[0] || null;
}

export function getTrack(trackId, catalog = LEARNING_CATALOG) {
  return getCatalog(catalog).trackById[trackId] || null;
}

export function getModule(moduleId, catalog = LEARNING_CATALOG) {
  return getCatalog(catalog).moduleById[moduleId] || null;
}

export function getLesson(lessonId, catalog = LEARNING_CATALOG) {
  return getCatalog(catalog).lessonById[lessonId] || null;
}

export function modulesForTrack(trackId, catalog = LEARNING_CATALOG) {
  const track = getTrack(trackId, catalog);
  if (!track) return [];
  return track.moduleIds.map((id) => getModule(id, catalog)).filter(Boolean);
}

export function lessonsForModule(moduleId, catalog = LEARNING_CATALOG) {
  const module = getModule(moduleId, catalog);
  if (!module) return [];
  return module.lessonIds.map((id) => getLesson(id, catalog)).filter(Boolean);
}

export function quizModuleForSection(sectionId, catalog = LEARNING_CATALOG) {
  const moduleId = QUIZ_MODULE_IDS[sectionId];
  return moduleId ? getModule(moduleId, catalog) : null;
}

function isCompleteMap(map, id) {
  return Boolean(asRecord(map)[id]);
}

export function isTrackUnlocked(progress, trackId, catalog = LEARNING_CATALOG) {
  const track = getTrack(trackId, catalog);
  if (!track) return false;
  const completed = asRecord(progress?.completedTracks);
  return (track.prerequisites || []).every((id) => isCompleteMap(completed, id));
}

export function isModuleUnlocked(progress, moduleId, catalog = LEARNING_CATALOG) {
  const module = getModule(moduleId, catalog);
  if (!module) return false;
  if (!isTrackUnlocked(progress, module.trackId, catalog)) return false;
  const completedModules = asRecord(progress?.completedModules);
  if ((module.prerequisites || []).some((id) => !isCompleteMap(completedModules, id))) return false;

  const siblings = modulesForTrack(module.trackId, catalog);
  const index = siblings.findIndex((item) => item.id === moduleId);
  if (index <= 0) return true;
  const previousRequired = siblings.slice(0, index).filter((item) => item.required !== false);
  return previousRequired.every((item) => isCompleteMap(completedModules, item.id));
}

export function isLessonUnlocked(progress, lessonId, catalog = LEARNING_CATALOG) {
  const lesson = getLesson(lessonId, catalog);
  if (!lesson) return false;
  if (!isModuleUnlocked(progress, lesson.moduleId, catalog)) return false;
  if (lesson.optional) return true;
  const siblings = lessonsForModule(lesson.moduleId, catalog);
  const index = siblings.findIndex((item) => item.id === lessonId);
  if (index <= 0) return true;
  const previousRequired = siblings.slice(0, index).filter((item) => !item.optional);
  const completed = asRecord(progress?.completedLessons);
  return previousRequired.every((item) => isCompleteMap(completed, item.id));
}

export function isLessonComplete(progress, lessonId) {
  return isCompleteMap(progress?.completedLessons, lessonId);
}

export function isModuleComplete(progress, moduleId, catalog = LEARNING_CATALOG) {
  if (isCompleteMap(progress?.completedModules, moduleId)) return true;
  const module = getModule(moduleId, catalog);
  if (!module) return false;
  const lessonsDone = (module.lessonIds || []).every((id) => {
    const lesson = getLesson(id, catalog);
    if (lesson?.optional) return true;
    return isCompleteMap(progress?.completedLessons, id);
  });
  const quizDone = module.quizId ? isCompleteMap(progress?.completedQuizzes, module.quizId) : true;
  return lessonsDone && quizDone;
}

export function isTrackComplete(progress, trackId, catalog = LEARNING_CATALOG) {
  if (isCompleteMap(progress?.completedTracks, trackId)) return true;
  const modules = modulesForTrack(trackId, catalog).filter((item) => item.required !== false);
  return modules.length > 0 && modules.every((item) => isModuleComplete(progress, item.id, catalog));
}

export function isPathComplete(progress, pathId, catalog = LEARNING_CATALOG) {
  const path = getPath(pathId, catalog);
  if (!path) return false;
  if (isCompleteMap(progress?.completedPaths, path.id)) return true;
  return path.trackIds.every((id) => isTrackComplete(progress, id, catalog));
}

function percent(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export function getModuleProgress(progress, moduleId, catalog = LEARNING_CATALOG) {
  const module = getModule(moduleId, catalog);
  if (!module) {
    return { id: moduleId, complete: false, unlocked: false, percent: 0, completedCount: 0, totalCount: 0 };
  }
  const requiredLessons = (module.lessonIds || []).filter((id) => !getLesson(id, catalog)?.optional);
  const lessonDone = requiredLessons.filter((id) => isCompleteMap(progress?.completedLessons, id)).length;
  const quizTotal = module.quizId ? 1 : 0;
  const quizDone = module.quizId && isCompleteMap(progress?.completedQuizzes, module.quizId) ? 1 : 0;
  const totalCount = requiredLessons.length + quizTotal;
  const completedCount = lessonDone + quizDone;
  return {
    id: module.id,
    name: module.name,
    trackId: module.trackId,
    quizId: module.quizId,
    required: module.required !== false,
    unlocked: isModuleUnlocked(progress, module.id, catalog),
    complete: isModuleComplete(progress, module.id, catalog),
    completedCount,
    totalCount,
    percent: percent(completedCount, totalCount),
    lessons: lessonsForModule(module.id, catalog).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      optional: Boolean(lesson.optional),
      unlocked: isLessonUnlocked(progress, lesson.id, catalog),
      complete: isLessonComplete(progress, lesson.id),
    })),
  };
}

export function getTrackProgress(progress, trackId, catalog = LEARNING_CATALOG) {
  const track = getTrack(trackId, catalog);
  if (!track) {
    return { id: trackId, complete: false, unlocked: false, percent: 0 };
  }
  const modules = modulesForTrack(track.id, catalog).map((module) =>
    getModuleProgress(progress, module.id, catalog)
  );
  const required = modules.filter((module) => module.required);
  const completedCount = required.filter((module) => module.complete).length;
  return {
    ...track,
    unlocked: isTrackUnlocked(progress, track.id, catalog),
    complete: isTrackComplete(progress, track.id, catalog),
    modules,
    completedCount,
    totalCount: required.length,
    percent: percent(completedCount, required.length),
  };
}

export function getPathProgress(progress, pathId, catalog = LEARNING_CATALOG) {
  const path = getPath(pathId, catalog);
  if (!path) {
    return { id: pathId, complete: false, percent: 0, tracks: [] };
  }
  const tracks = path.trackIds.map((id) => getTrackProgress(progress, id, catalog));
  const completedCount = tracks.filter((track) => track.complete).length;
  return {
    id: path.id,
    name: path.name,
    description: path.description,
    complete: isPathComplete(progress, path.id, catalog),
    tracks,
    completedCount,
    totalCount: tracks.length,
    percent: percent(completedCount, tracks.length),
  };
}

export function getNextLearningItem(progress, pathId, catalog = LEARNING_CATALOG) {
  const path = getPathProgress(progress, pathId, catalog);
  for (const track of path.tracks) {
    if (!track.unlocked) {
      return {
        kind: "track",
        id: track.id,
        title: track.name,
        locked: true,
        reason: "Complete the required previous track first.",
        trackId: track.id,
      };
    }
    for (const module of track.modules) {
      if (!module.unlocked) continue;
      const nextLesson = module.lessons.find((lesson) => lesson.unlocked && !lesson.complete);
      if (nextLesson) {
        return {
          kind: "lesson",
          id: nextLesson.id,
          title: nextLesson.title,
          locked: false,
          trackId: track.id,
          moduleId: module.id,
        };
      }
      if (module.quizId && !isCompleteMap(progress?.completedQuizzes, module.quizId)) {
        return {
          kind: "quiz",
          id: module.quizId,
          title: `${module.name} quiz`,
          locked: !module.unlocked,
          trackId: track.id,
          moduleId: module.id,
        };
      }
    }
  }
  if (path.complete) {
    return { kind: "complete", id: path.id, title: path.name, locked: false };
  }
  return { kind: "none", id: null, title: "No recommended activity", locked: false };
}

export function lessonsCompletedForQuizMigration(sectionId, catalog = LEARNING_CATALOG) {
  const module = quizModuleForSection(sectionId, catalog);
  if (!module) return [];
  const intro = modulesForTrack(module.trackId, catalog).find((item) => !item.quizId);
  return intro ? intro.lessonIds.slice() : [];
}
