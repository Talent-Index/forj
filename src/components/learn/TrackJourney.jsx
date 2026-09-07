import { Button, Card, ProgressBar } from "../ui/primitives";
import { AnimatedDoodle, DoodleText } from "../doodles";
import { formatDifficulty, formatDuration, TRACK_PRESENTATION } from "../../utils/learningPresentation";

function statusGlyph(status, kind) {
  if (kind === "credential") return status === "completed" ? "◇" : "◇";
  if (status === "completed") return "✓";
  if (status === "current") return "◉";
  if (status === "available") return "○";
  return "○";
}

function TrackJourney({
  track,
  journey,
  presentation,
  onBack,
  onOpenLesson,
  onStartQuiz,
  onCredentials,
}) {
  const meta = presentation || TRACK_PRESENTATION[track.id] || {};
  const duration = formatDuration(meta.estimatedMinutes);

  return (
    <div className="page learn-track-page">
      <header className="page-header">
        <p className="kicker">{formatDifficulty(track.difficulty)}</p>
        <h1>
          <DoodleText trigger="immediate" mark="underline">
            {track.name}
          </DoodleText>
        </h1>
        <p className="lede">{track.description}</p>
        <div className="learn-track-stats">
          <span>{track.totalCount} Modules</span>
          <span>{duration}</span>
          <span>{track.percent}% complete</span>
        </div>
        {meta.skills?.length ? (
          <p className="learn-skill-chips">
            {meta.skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </p>
        ) : null}
        <ProgressBar label="Track progress" value={track.percent} />
        {!track.unlocked && (
          <p className="meta-line">Finish the previous track first to unlock this journey.</p>
        )}
      </header>

      <section className="section-block learn-path-strip" aria-label="Learning path stages">
        <p className="kicker">Your learning path</p>
        <ol className="learn-stage-rail">
          {["Start", "Foundations", "Practice", "Challenges", "Build", "Credential"].map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ol>
        <div className="learn-path-doodle" aria-hidden="true">
          <AnimatedDoodle type="arrowDown" animation="draw" trigger="viewport" size={20} variant="muted" />
        </div>
      </section>

      <section className="section-block">
        <h2>Modules</h2>
        <ol className="learn-journey">
          {journey.map((step) => (
            <li
              key={step.id}
              className={`learn-journey-step is-${step.status} is-${step.kind}`}
            >
              <span className="learn-journey-mark" aria-hidden="true">
                {statusGlyph(step.status, step.kind)}
              </span>
              <div className="learn-journey-body">
                <p className="kicker">
                  {String(step.index).padStart(2, "0")}
                  {step.kind === "challenge" ? " — Challenge" : step.kind === "credential" ? " — Credential" : " — Module"}
                </p>
                <h3>{step.title}</h3>
                <p className="meta-line">{step.summary}</p>
                {step.status === "current" || step.status === "available" || step.status === "completed" ? (
                  <div className="learn-journey-actions">
                    {step.lessons.map((lesson) => (
                      <Card key={lesson.id} className="lesson-row">
                        <div>
                          <h4>{lesson.title}</h4>
                          <p className="meta-line">
                            {lesson.complete ? "Complete" : lesson.unlocked ? "Ready" : "Locked"}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          disabled={!lesson.unlocked}
                          onClick={() => onOpenLesson(lesson.id)}
                        >
                          {lesson.complete ? "Review" : "Open"}
                        </Button>
                      </Card>
                    ))}
                    {step.quizId ? (
                      <Card className="lesson-row learn-challenge-row">
                        <div>
                          <p className="kicker">Challenge</p>
                          <h4>{step.title}</h4>
                          <p className="meta-line">Knowledge check · seats puzzle pieces</p>
                        </div>
                        <Button
                          disabled={step.status === "locked"}
                          onClick={() => onStartQuiz(step.quizId)}
                        >
                          {step.status === "completed" ? "Retry challenge" : "Start challenge"}
                        </Button>
                      </Card>
                    ) : null}
                    {step.kind === "credential" && track.complete ? (
                      <Button onClick={onCredentials}>View credential →</Button>
                    ) : null}
                  </div>
                ) : (
                  <p className="meta-line">Complete earlier modules to unlock.</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="quiz-nav quiz-nav-end">
        <Button variant="secondary" onClick={onBack}>All tracks</Button>
      </div>
    </div>
  );
}

export default TrackJourney;
