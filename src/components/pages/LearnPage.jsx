import { useMemo, useState } from "react";
import { LEARNING_CATALOG, getLearningCatalog } from "../../data/learning.js";
import {
  getTrackProgress,
  getPathProgress,
  getNextLearningItem,
  isLessonUnlocked,
  isLessonComplete,
} from "../../utils/progression/paths.js";
import {
  listTrackCards,
  buildTrackJourney,
  lessonContext,
  TRACK_PRESENTATION,
} from "../../utils/learningPresentation.js";
import SectionSelect from "../SectionSelect";
import LearnHub from "../learn/LearnHub";
import TrackJourney from "../learn/TrackJourney";
import LessonWorkspace from "../learn/LessonWorkspace";

function LearnPage({
  progression,
  sectionScores,
  totalPoints,
  completedSections,
  onSelectSection,
  onGoToPuzzle,
  onCompleteLesson,
  onCredentials,
  pendingKnowledgeCheck = false,
}) {
  const [trackId, setTrackId] = useState(null);
  const [lessonId, setLessonId] = useState(null);
  const [category, setCategory] = useState("All");
  const catalog = getLearningCatalog();
  const state = progression?.state;
  const path = useMemo(
    () => getPathProgress(state || {}, catalog.defaultPathId),
    [state, catalog.defaultPathId]
  );
  const nextItem = useMemo(
    () => getNextLearningItem(state || {}, catalog.defaultPathId),
    [state, catalog.defaultPathId]
  );
  const trackCards = useMemo(
    () => listTrackCards(state || {}, category),
    [state, category]
  );
  const activeTrack = trackId ? getTrackProgress(state || {}, trackId) : null;
  const journey = activeTrack ? buildTrackJourney(activeTrack) : [];
  const context = lessonId ? lessonContext(lessonId, state || {}, catalog) : null;

  function continueNext() {
    if (!nextItem || nextItem.locked) return;
    if (nextItem.kind === "lesson") {
      setTrackId(nextItem.trackId);
      setLessonId(nextItem.id);
      return;
    }
    if (nextItem.kind === "quiz") {
      onSelectSection(nextItem.id);
    }
    if (nextItem.kind === "track") {
      setTrackId(nextItem.trackId);
      setLessonId(null);
    }
  }

  function openLesson(id) {
    const ctx = lessonContext(id, state || {}, catalog);
    if (ctx?.track?.id) setTrackId(ctx.track.id);
    setLessonId(id);
  }

  function afterLessonComplete(id) {
    onCompleteLesson(id);
    const ctx = lessonContext(id, {
      ...state,
      completedLessons: { ...(state?.completedLessons || {}), [id]: Date.now() },
    }, catalog);
    if (!ctx) {
      setLessonId(null);
      return;
    }
    const index = ctx.siblings.findIndex((item) => item.id === id);
    const following = ctx.siblings[index + 1];
    if (following) {
      setLessonId(following.id);
      return;
    }
    if (ctx.module?.quizId) {
      setLessonId(null);
      return;
    }
    setLessonId(null);
  }

  if (context?.lesson) {
    const unlocked = isLessonUnlocked(state || {}, context.lesson.id);
    const complete = isLessonComplete(state || {}, context.lesson.id);
    const index = context.siblings.findIndex((item) => item.id === context.lesson.id);
    const following = context.siblings[index + 1];
    let nextAction = null;
    if (complete && following) {
      nextAction = {
        title: following.title,
        detail: "Next lesson in this module",
        cta: "Open next lesson",
        onClick: () => openLesson(following.id),
      };
    } else if (complete && context.module?.quizId) {
      nextAction = {
        title: "Knowledge check",
        detail: "Challenge to prove this module",
        cta: "Start challenge",
        onClick: () => onSelectSection(context.module.quizId),
      };
    } else if (!complete) {
      nextAction = {
        title: "Complete lesson",
        detail: "Mark complete to unlock the next step",
        cta: null,
        onClick: null,
      };
    }

    return (
      <LessonWorkspace
        context={context}
        unlocked={unlocked}
        complete={complete}
        xp={progression?.summary?.xp ?? 0}
        nextAction={nextAction}
        onBackTrack={() => setLessonId(null)}
        onOpenLesson={openLesson}
        onComplete={afterLessonComplete}
        onNext={undefined}
      />
    );
  }

  if (activeTrack) {
    return (
      <TrackJourney
        track={activeTrack}
        journey={journey}
        presentation={TRACK_PRESENTATION[activeTrack.id]}
        onBack={() => setTrackId(null)}
        onOpenLesson={openLesson}
        onStartQuiz={onSelectSection}
        onCredentials={onCredentials}
      />
    );
  }

  return (
    <LearnHub
      path={path}
      nextItem={nextItem}
      trackCards={trackCards}
      category={category}
      onCategory={setCategory}
      onContinue={continueNext}
      onOpenTrack={(id) => {
        setTrackId(id);
        setLessonId(null);
      }}
      knowledgeCheck={
        pendingKnowledgeCheck
          ? {
              title: "Knowledge check ready",
              body: "You have completed enough learning activities. Take an assessment to earn XP and puzzle fragments.",
              cta: "Open assessments",
              onClick: () => {
                const el = document.getElementById("forge-assessments");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              },
            }
          : null
      }
      assessments={
        <div id="forge-assessments">
          <SectionSelect
            sectionScores={sectionScores}
            totalPoints={totalPoints}
            completedSections={completedSections}
            onSelectSection={onSelectSection}
            onGoToPuzzle={onGoToPuzzle}
          />
        </div>
      }
    />
  );
}

export default LearnPage;
export { LEARNING_CATALOG };
