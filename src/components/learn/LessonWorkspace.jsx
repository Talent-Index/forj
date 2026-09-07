import { Button, Card, ProgressBar } from "../ui/primitives";
import { AnimatedDoodle } from "../doodles";
import { safeExternalHref } from "../../utils/frontendSecurity";
import { TRACK_PRESENTATION } from "../../utils/learningPresentation";

function LessonWorkspace({
  context,
  unlocked,
  complete,
  xp = 0,
  nextAction,
  onBackTrack,
  onOpenLesson,
  onComplete,
  onNext,
}) {
  const { lesson, module, track, trackProgress, moduleProgress, siblings, lessonIndex, lessonTotal } =
    context;
  const skills = TRACK_PRESENTATION[track?.id]?.skills || [];

  return (
    <div className="page lesson-workspace">
      <aside className="lesson-nav" aria-label="Track navigation">
        <p className="kicker">{track?.name}</p>
        <h2>{module?.name}</h2>
        <ol className="lesson-nav-list">
          {siblings.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={`lesson-nav-item ${item.id === lesson.id ? "is-current" : ""} ${item.complete ? "is-complete" : ""}`}
                disabled={!item.unlocked && item.id !== lesson.id}
                onClick={() => onOpenLesson(item.id)}
              >
                <span className="lesson-nav-index">{String(index + 1).padStart(2, "0")}</span>
                <span>{item.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <Button variant="secondary" onClick={onBackTrack}>
          Track overview
        </Button>
      </aside>

      <article className="lesson-main">
        <header className="page-header">
          <p className="kicker">
            {track?.name} · Lesson {lessonIndex} of {lessonTotal}
          </p>
          <h1>{lesson.title}</h1>
          <p className="lede">
            {unlocked ? "Read carefully, then mark complete to unlock what follows." : "This lesson is locked."}
          </p>
        </header>
        <div className="card lesson-body">
          {lesson.body.split("\n\n").map((paragraph, index) => (
            <p key={`${lesson.id}-${index}`}>{paragraph}</p>
          ))}
          {lesson.reference && safeExternalHref(lesson.reference.url) && (
            <p className="lesson-reference">
              <span className="kicker">Official reference</span>
              <a href={safeExternalHref(lesson.reference.url)} target="_blank" rel="noopener noreferrer">
                {lesson.reference.title}
              </a>
            </p>
          )}
        </div>
        <div className="quiz-nav quiz-nav-end">
          <Button variant="secondary" onClick={onBackTrack}>
            Back
          </Button>
          <Button
            disabled={!unlocked || complete}
            onClick={() => {
              onComplete(lesson.id);
              onNext?.();
            }}
          >
            {complete ? "Completed" : "Mark complete"}
          </Button>
        </div>
      </article>

      <aside className="lesson-rail" aria-label="Lesson progress">
        <Card className="lesson-rail-card">
          <p className="kicker">Your progress</p>
          <h3>
            Module {(trackProgress?.modules?.findIndex((m) => m.id === module?.id) ?? 0) + 1} /{" "}
            {trackProgress?.totalCount || "—"}
          </h3>
          <ProgressBar value={moduleProgress?.percent ?? 0} label="Module" />
          <ProgressBar value={trackProgress?.percent ?? 0} label="Track" />
          <p className="meta-line">{xp} XP</p>
        </Card>
        <Card className="lesson-rail-card">
          <p className="kicker">Skills</p>
          <ul className="lesson-skill-list">
            {skills.map((skill) => (
              <li key={skill}>
                <AnimatedDoodle
                  type={complete ? "check" : "circle"}
                  animation={complete ? "draw" : "draw"}
                  trigger="viewport"
                  size={12}
                  variant={complete ? "accent" : "muted"}
                />
                {skill}
              </li>
            ))}
          </ul>
        </Card>
        {nextAction ? (
          <Card className="lesson-rail-card">
            <p className="kicker">Next</p>
            <h3>{nextAction.title}</h3>
            <p className="meta-line">{nextAction.detail}</p>
            {nextAction.onClick ? (
              <Button onClick={nextAction.onClick}>{nextAction.cta}</Button>
            ) : null}
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

export default LessonWorkspace;
