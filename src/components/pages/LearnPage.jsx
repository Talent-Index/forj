import { useMemo, useState } from "react";
import { LEARNING_CATALOG, TRACKS, getLearningCatalog } from "../../data/learning.js";
import {
  getTrackProgress,
  getPathProgress,
  getNextLearningItem,
  isLessonUnlocked,
  isLessonComplete,
  isTrackUnlocked,
} from "../../utils/progression/paths.js";
import { Button, Card, ProgressBar } from "../ui/primitives";
import { safeExternalHref } from "../../utils/frontendSecurity";
import SectionSelect from "../SectionSelect";

function LearnPage({
  progression,
  sectionScores,
  totalPoints,
  completedSections,
  onSelectSection,
  onGoToPuzzle,
  onCompleteLesson,
}) {
  const [trackId, setTrackId] = useState(null);
  const [lessonId, setLessonId] = useState(null);
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
  const lesson = lessonId ? catalog.lessonById[lessonId] : null;
  const activeTrack = trackId ? getTrackProgress(state || {}, trackId) : null;

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
  }

  if (lesson) {
    const unlocked = isLessonUnlocked(state || {}, lesson.id);
    const complete = isLessonComplete(state || {}, lesson.id);
    return (
      <div className="page">
        <header className="page-header">
          <p className="kicker">Lesson</p>
          <h1>{lesson.title}</h1>
          <p className="lede">{unlocked ? "Read, then mark complete. This counts as learning activity." : "This lesson is locked."}</p>
        </header>
        <article className="card lesson-body">
          {lesson.body.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          {lesson.reference && safeExternalHref(lesson.reference.url) && (
            <p className="meta-line">
              <a href={safeExternalHref(lesson.reference.url)} target="_blank" rel="noopener noreferrer">{lesson.reference.title}</a>
            </p>
          )}
        </article>
        <div className="quiz-nav quiz-nav-end">
          <Button variant="secondary" onClick={() => setLessonId(null)}>Back to track</Button>
          <Button
            disabled={!unlocked || complete}
            onClick={() => {
              onCompleteLesson(lesson.id);
              setLessonId(null);
            }}
          >
            {complete ? "Completed" : "Mark complete"}
          </Button>
        </div>
      </div>
    );
  }

  if (activeTrack) {
    return (
      <div className="page">
        <header className="page-header">
          <p className="kicker">{activeTrack.difficulty}</p>
          <h1>{activeTrack.name}</h1>
          <p className="lede">{activeTrack.description}</p>
        </header>
        <ProgressBar label={`${activeTrack.completedCount}/${activeTrack.totalCount} modules`} value={activeTrack.percent} />
        {!activeTrack.unlocked && <p className="meta-line">Complete the previous track to unlock this one.</p>}
        {activeTrack.modules.map((module) => (
          <section className="section-block" key={module.id}>
            <h2>{module.name}</h2>
            <p className="meta-line">{module.complete ? "Complete" : module.unlocked ? "In progress" : "Locked"} · {module.percent}%</p>
            {module.lessons.map((item) => (
              <Card key={item.id} className="lesson-row">
                <div>
                  <h3>{item.title}</h3>
                  <p className="meta-line">{item.complete ? "Complete" : item.unlocked ? "Ready" : "Locked"}</p>
                </div>
                <Button
                  variant="secondary"
                  disabled={!item.unlocked}
                  onClick={() => setLessonId(item.id)}
                >
                  {item.complete ? "Review" : "Open"}
                </Button>
              </Card>
            ))}
            {module.quizId && (
              <Button disabled={!module.unlocked} onClick={() => onSelectSection(module.quizId)}>
                {module.complete ? "Retry assessment" : "Take assessment"}
              </Button>
            )}
          </section>
        ))}
        <Button variant="secondary" onClick={() => setTrackId(null)}>All tracks</Button>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Forjora learning</p>
        <h1>{path.name || "Avalanche Developer Path"}</h1>
        <p className="lede">{path.description || "Lessons unlock in order. Quizzes still use retry-safe scoring."}</p>
      </header>

      <section className="section-block">
        <ProgressBar label={`Path ${path.completedCount}/${path.totalCount} tracks`} value={path.percent} />
        {nextItem && (
          <div className="path-continue">
            <div>
              <p className="kicker">Next</p>
              <h2>{nextItem.title}</h2>
              {nextItem.reason && <p className="meta-line">{nextItem.reason}</p>}
            </div>
            <Button disabled={nextItem.locked || nextItem.kind === "complete"} onClick={continueNext}>
              Continue
            </Button>
          </div>
        )}
      </section>

      <section className="section-block">
        <h2>Tracks</h2>
        <div className="track-grid">
          {TRACKS.map((track) => {
            const progress = getTrackProgress(state || {}, track.id);
            const unlocked = isTrackUnlocked(state || {}, track.id);
            return (
              <Card key={track.id} className={`track-card ${progress.complete ? "is-complete" : ""} ${unlocked ? "" : "is-locked"}`}>
                <p className="kicker">{track.difficulty}</p>
                <h3>{track.name}</h3>
                <p>{track.description}</p>
                <p className="meta-line">{progress.percent}% · {unlocked ? (progress.complete ? "Complete" : "Unlocked") : "Locked"}</p>
                <Button variant="secondary" onClick={() => setTrackId(track.id)}>
                  {unlocked ? "Open track" : "View requirements"}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      <SectionSelect
        sectionScores={sectionScores}
        totalPoints={totalPoints}
        completedSections={completedSections}
        onSelectSection={onSelectSection}
        onGoToPuzzle={onGoToPuzzle}
      />
    </div>
  );
}

export default LearnPage;
export { LEARNING_CATALOG };
