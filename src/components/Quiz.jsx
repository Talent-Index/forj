import { useState, useEffect, useRef } from "react";
import { getSectionById, TOTAL_PIECES } from "../data/questions";
import {
  quizLengthFor,
  canAcceptSubmit,
  findQuestionById,
  getAnswerFeedback,
  getQuestionBankStatus,
  quizProgress,
  selectQuizQuestions,
  summarizeAttempt,
} from "../utils/quiz";
import { FORGE_LEVEL_META, FRAGMENTS_PER_PIECE } from "../utils/quizConfig";
import { masteryForSection } from "../utils/mastery";
import { fragmentProgress } from "../utils/fragments";
import { playCorrectSound, playWrongSound, playSectionCompleteSound } from "../utils/sounds";
import { ERROR_STATES, PATH_COPY, FORGE_LEVEL_LABELS } from "../utils/onboarding";
import { safeExternalHref } from "../utils/frontendSecurity";
import { Button, ProgressBar } from "./ui/primitives";
import EmptyState from "./EmptyState";
import { AnimatedDoodle, LoadingForge, XpHandwrite } from "./doodles";

const OPTION_HOTKEYS = ["a", "b", "c", "d"];

function QuizError({ body, onBack, onRetry }) {
  return (
    <div className="card quiz-intro">
      <Button variant="secondary" onClick={onBack}>Back</Button>
      <EmptyState
        variant="error"
        title={ERROR_STATES.quiz.title}
        body={body}
        actionLabel={onRetry ? "Retry challenge" : "Back to paths"}
        onAction={onRetry || onBack}
      />
    </div>
  );
}

function Quiz({
  sectionId,
  onComplete,
  onBack,
  seenQuestionIds = [],
  rewardSummary = null,
  puzzlePieceCount = 0,
  onGoToPuzzle,
}) {
  const section = getSectionById(sectionId);
  const pointsPerQ = section?.pointsPerQuestion ?? 0;
  const timePerQ = section?.timePerQuestion ?? 0;
  const expectedCount = quizLengthFor(sectionId);
  const bank = getQuestionBankStatus(section, expectedCount);
  const path = PATH_COPY[sectionId] || { kicker: section?.name, title: section?.name };
  const forgeLabel = FORGE_LEVEL_LABELS[sectionId] || path.kicker;
  const levelMeta = FORGE_LEVEL_META[sectionId];

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [startError, setStartError] = useState(bank.error);
  const [phase, setPhase] = useState("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timePerQ);
  const [showHint, setShowHint] = useState(false);
  const [answerLog, setAnswerLog] = useState([]);
  const timerRef = useRef(null);
  const lockedRef = useRef(false);
  const finishedRef = useRef(false);
  const handleTimeUpRef = useRef(() => {});

  const qCount = quizQuestions.length;
  const q = quizQuestions[current];
  const progress = quizProgress({ current, answered, total: qCount || expectedCount });
  const liveSummary = summarizeAttempt(answerLog, pointsPerQ, expectedCount);

  function lockAnswer(option) {
    if (lockedRef.current || !q) return null;
    lockedRef.current = true;
    const source = findQuestionById(section, q.id);
    const result = getAnswerFeedback(source, option);
    if (!result) {
      clearInterval(timerRef.current);
      setStartError("This question could not be scored. Retry the quiz to start a new attempt.");
      setPhase("error");
      return null;
    }
    clearInterval(timerRef.current);
    setSelected(option);
    setFeedback(result);
    setAnswered(true);
    if (result.isCorrect) playCorrectSound();
    else playWrongSound();
    setAnswerLog((log) => [
      ...log,
      {
        id: q.id,
        prompt: q.question,
        correct: result.isCorrect,
        timedOut: result.timedOut,
        points: result.isCorrect ? pointsPerQ : 0,
      },
    ]);
    return result;
  }

  function handleTimeUp() {
    if (answered || lockedRef.current) return;
    lockAnswer(null);
  }

  useEffect(() => {
    handleTimeUpRef.current = handleTimeUp;
  });

  useEffect(() => {
    if (phase !== "quiz" || answered) return undefined;
    setTimeLeft(timePerQ);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeUpRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, current, answered, timePerQ]);

  function startQuiz() {
    if (phase === "loading" || !section || !bank.ok) return;
    finishedRef.current = false;
    lockedRef.current = false;
    setStartError(null);
    setPhase("loading");
  }

  useEffect(() => {
    if (phase !== "loading" || !section) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const result = selectQuizQuestions(section, {
        count: expectedCount,
        seenIds: seenQuestionIds,
      });
      if (cancelled) return;
      if (!result.ok) {
        setStartError(result.error);
        setQuizQuestions([]);
        setPhase("intro");
        return;
      }
      setQuizQuestions(result.questions);
      setCurrent(0);
      setSelected(null);
      setAnswered(false);
      setFeedback(null);
      setShowHint(false);
      setTimeLeft(section.timePerQuestion);
      setAnswerLog([]);
      lockedRef.current = false;
      setPhase("quiz");
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, section, expectedCount, seenQuestionIds]);

  function handleSelect(option) {
    if (answered || lockedRef.current || !q) return;
    setSelected(option);
  }

  function handleSubmit() {
    if (!canAcceptSubmit({ answered, locked: lockedRef.current, selected }) || !q) return;
    lockAnswer(selected);
  }

  function handleNext() {
    if (!answered || finishedRef.current) return;
    if (current < qCount - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
      setFeedback(null);
      setShowHint(false);
      lockedRef.current = false;
      return;
    }
    finishedRef.current = true;
    const summary = summarizeAttempt(answerLog, pointsPerQ, qCount);
    playSectionCompleteSound();
    onComplete({
      sectionId,
      correct: summary.correct,
      total: summary.total,
      pointsEarned: summary.pointsEarned,
      wrong: summary.wrong,
      questionIds: answerLog.map((item) => item.id).filter(Boolean),
      perfect: summary.correct === summary.total && summary.total > 0,
    });
    setPhase("results");
  }

  useEffect(() => {
    if (phase !== "quiz" || !q) return undefined;
    function onKey(event) {
      const key = event.key.toLowerCase();
      if (!answered && !lockedRef.current) {
        const idx = OPTION_HOTKEYS.indexOf(key);
        if (idx >= 0 && q.options[idx]) handleSelect(q.options[idx]);
        if (key === "enter") {
          event.preventDefault();
          handleSubmit();
        }
      } else if (answered && key === "enter") {
        event.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function getButtonClass(option) {
    if (!answered) {
      return option === selected ? "option-btn selected" : "option-btn";
    }
    const classes = ["option-btn", "disabled"];
    if (feedback && option === feedback.answer) classes.push("correct");
    else if (option === selected) classes.push("wrong");
    return classes.join(" ");
  }

  if (!section) {
    return (
      <QuizError
        body="That difficulty is not available. Choose Foundation, Builder, Advanced, or Mastery."
        onBack={onBack}
      />
    );
  }

  if (phase === "loading") {
    return (
      <div className="page quiz-flow">
        <div className="card quiz-intro loading-forge" aria-busy="true">
          <LoadingForge label="Forging your challenge…" />
          <p className="kicker">{forgeLabel}</p>
          <p role="status">Selecting {expectedCount} unique questions for {path.title}.</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <QuizError
        body={startError || ERROR_STATES.quiz.body}
        onBack={onBack}
        onRetry={bank.ok ? startQuiz : undefined}
      />
    );
  }

  if (phase === "intro") {
    return (
      <div className="page quiz-flow">
        <div className="card quiz-intro">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <p className="kicker">{forgeLabel}</p>
        <h2>{path.title}</h2>
        <p>{levelMeta?.blurb || section.description}</p>
        <ul className="quiz-rules">
          <li>{expectedCount} unique questions</li>
          <li>{timePerQ} seconds per question</li>
          <li>{pointsPerQ} points per correct answer (seating credit caps at five counted corrects for Easy / Medium / Hard)</li>
          <li>First completion awards XP and puzzle fragments · retries do not farm rewards</li>
          <li>Select an answer, then submit. Explanations appear after you submit</li>
        </ul>
        {(startError || !bank.ok) && (
          <EmptyState
            variant="error"
            title={ERROR_STATES.quiz.title}
            body={startError || bank.error || ERROR_STATES.quiz.body}
            actionLabel={bank.ok ? "Retry challenge" : "Back to paths"}
            onAction={bank.ok ? startQuiz : onBack}
          />
        )}
        <Button onClick={startQuiz} disabled={!bank.ok}>
          Start challenge
          <AnimatedDoodle type="arrow" animation="draw" trigger="immediate" size={14} variant="ink" />
        </Button>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const summary = summarizeAttempt(answerLog, pointsPerQ, qCount || expectedCount);
    const mastery = masteryForSection(
      { [sectionId]: { correct: summary.correct, total: summary.total } },
      sectionId
    );
    const rewards = rewardSummary || {};
    const fragmentsAwarded = Number(rewards.fragmentsAwarded) || 0;
    const xpAwarded = Number(rewards.xpAwarded) || 0;
    const pieces = Number(rewards.puzzlePieceCount ?? puzzlePieceCount) || 0;
    const fragMeter = fragmentProgress(rewards.puzzleFragments ?? 0);
    const piecesUnlocked = Array.isArray(rewards.piecesUnlocked) ? rewards.piecesUnlocked : [];
    return (
      <div className="page quiz-results">
        <header className="page-header">
          <p className="kicker">Challenge complete · {forgeLabel}</p>
          <h1>{path.title}</h1>
          <p className="lede">
            {summary.correct} / {summary.total} · {summary.percent}%
          </p>
          {xpAwarded > 0 ? <XpHandwrite amount={xpAwarded} active /> : null}
        </header>
        <div className="quiz-score-grid" aria-label="Score breakdown">
          <div className="quiz-score-card">
            <p className="kicker">Score</p>
            <p className="stat-value">{summary.correct}/{summary.total}</p>
          </div>
          <div className="quiz-score-card">
            <p className="kicker">Mastery</p>
            <p className="stat-value">{mastery.percent}%</p>
          </div>
          <div className="quiz-score-card">
            <p className="kicker">XP</p>
            <p className="stat-value">+{xpAwarded}</p>
          </div>
          <div className="quiz-score-card quiz-score-card-points">
            <p className="kicker">Fragments</p>
            <p className="stat-value">+{fragmentsAwarded}</p>
            <p className="meta-line">
              {fragMeter.towardNext}/{FRAGMENTS_PER_PIECE} toward next piece
            </p>
          </div>
        </div>
        <section className="section-block">
          <h2>Puzzle progress</h2>
          <p className="lede">
            {pieces} / {TOTAL_PIECES} pieces
            {piecesUnlocked.length > 0 ? ` · +${piecesUnlocked.length} unlocked from fragments` : ""}
          </p>
          <ProgressBar value={(pieces / TOTAL_PIECES) * 100} label={`${pieces} of ${TOTAL_PIECES}`} />
        </section>
        <section className="section-block">
          <h2>Question breakdown</h2>
          <ol className="results-list">
            {answerLog.map((item, index) => (
              <li key={`${item.id}-${index}`}>
                <span className={item.correct ? "result-mark-ok" : "result-mark-bad"}>
                  {item.correct ? "Correct" : item.timedOut ? "Timed out" : "Incorrect"}
                </span>
                <span>Question {index + 1}</span>
                <span className="meta-line">{item.points} pts</span>
              </li>
            ))}
          </ol>
        </section>
        <div className="quiz-nav quiz-nav-end page-actions">
          <Button variant="secondary" onClick={startQuiz}>Retry challenge</Button>
          {onGoToPuzzle ? (
            <Button onClick={onGoToPuzzle}>
              Continue to puzzle
              <AnimatedDoodle type="arrow" animation="draw" trigger="immediate" size={14} variant="ink" />
            </Button>
          ) : (
            <Button onClick={onBack}>Continue learning</Button>
          )}
        </div>
      </div>
    );
  }

  if (!q || qCount !== expectedCount) {
    return (
      <QuizError
        body={`This attempt could not load exactly ${expectedCount} questions.`}
        onBack={onBack}
        onRetry={bank.ok ? startQuiz : undefined}
      />
    );
  }

  const timerPct = timePerQ ? (timeLeft / timePerQ) * 100 : 0;
  const timerUrgent = timeLeft <= 5;
  const resultTitle = feedback?.timedOut ? "Time's up" : feedback?.isCorrect ? "Nice" : "Not yet";
  const canSubmit = canAcceptSubmit({ answered, locked: false, selected });
  const challengeN = String(current + 1).padStart(2, "0");

  return (
    <div className="page quiz-flow">
    <div className="card quiz-active challenge-sheet">
      <div className="challenge-sheet-inner">
      <div className="quiz-header-row">
        <div>
          <p className="kicker">Challenge {challengeN}</p>
          <h2>{path.title}</h2>
        </div>
        <span className="badge">{forgeLabel}</span>
      </div>
      <ol className="quiz-stepper" aria-label="Question counter">
        {quizQuestions.map((item, index) => {
          const done = index < current || (index === current && answered);
          const active = index === current && !answered;
          return (
            <li
              key={item.id}
              className={`quiz-step${done ? " done" : ""}${active ? " current" : ""}`}
              aria-current={index === current ? "step" : undefined}
            >
              <span className="visually-hidden">
                Question {index + 1} of {qCount}{done ? ", completed" : active ? ", current" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <ProgressBar label={`Progress · ${progress.completed} of ${progress.total}`} value={progress.percent} />
      <div className="quiz-session-meta">
        <span>{liveSummary.correct} correct</span>
        <span>+{liveSummary.pointsEarned} pts</span>
        <span>{progress.remaining} left</span>
      </div>
      <div className="quiz-timer-row">
        <span className={timerUrgent ? "quiz-timer-urgent" : ""}>
          {timeLeft}s remaining
        </span>
      </div>
      <div className="timer-bar" role="timer" aria-label={`${timeLeft} seconds remaining`}>
        <div className={`timer-fill ${timerUrgent ? "timer-fill-urgent" : ""}`} style={{ width: `${timerPct}%` }} />
      </div>
      <h3 className="question-text">
        <span className="quiz-question-doodle" aria-hidden="true">
          <AnimatedDoodle
            key={`q-${q.id}`}
            type="question"
            animation="draw"
            trigger="immediate"
            size={22}
            variant="muted"
          />
        </span>
        {q.question}
      </h3>
      {q.hint && !answered && (
        <div className="hint-row">
          <Button variant="secondary" className="btn-hint" onClick={() => setShowHint((s) => !s)}>
            {showHint ? "Hide hint" : "Show hint"}
          </Button>
          {showHint && <div className="hint-text">{q.hint}</div>}
        </div>
      )}
      <div className="options-grid" role="listbox" aria-label="Possible answers">
        {q.options.map((option, idx) => {
          const isSelected = !answered && option === selected;
          return (
            <button
              key={`${q.id}-${idx}`}
              type="button"
              className={getButtonClass(option)}
              onClick={() => handleSelect(option)}
              disabled={answered}
              aria-pressed={isSelected}
            >
              <span className="option-mark" aria-hidden="true" />
              <span className="option-text">{option}</span>
              {isSelected && <span className="option-selected-label">Selected</span>}
            </button>
          );
        })}
      </div>
      <p className="quiz-select-hint" aria-live="polite">
        {answered
          ? "Answer locked. Read the explanation, then continue."
          : selected
            ? "Answer selected. Submit to lock it in."
            : "Choose one of the possible answers, then submit."}
      </p>
      {answered && feedback && (
        <div className={`quiz-feedback ${feedback.isCorrect ? "" : "quiz-feedback-wrong"}`} role="status">
          <p className={feedback.isCorrect ? "feedback-nice" : "feedback-not-yet"}>
            <AnimatedDoodle
              type={feedback.isCorrect ? "check" : "question"}
              animation={feedback.isCorrect ? "draw" : "wiggle"}
              trigger="success"
              active
              size={18}
              variant={feedback.isCorrect ? "accent" : "earth"}
            />
            {resultTitle}
            {!feedback.isCorrect ? <span className="meta-line"> · Try again</span> : null}
          </p>
          {feedback.isCorrect ? (
            <XpHandwrite amount={pointsPerQ} active className="xp-callout" />
          ) : (
            <p>Read the explanation, then continue. Retries replace this section’s score.</p>
          )}
          {!feedback.isCorrect && (
            <p>
              {feedback.timedOut ? "No answer was submitted." : `You chose: ${feedback.selected}`}
              {" "}Correct answer: {feedback.answer}
            </p>
          )}
          <p>{feedback.explanation}</p>
          {feedback.funFact && <p className="quiz-fun-fact">{feedback.funFact}</p>}
          {feedback.reference && safeExternalHref(feedback.reference.url) && (
            <p>
              <a href={safeExternalHref(feedback.reference.url)} target="_blank" rel="noopener noreferrer">
                Learn more: {feedback.reference.title}
              </a>
            </p>
          )}
        </div>
      )}
      <div className="quiz-nav page-actions">
        <Button variant="secondary" onClick={onBack}>Exit</Button>
        {!answered && (
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Submit answer
          </Button>
        )}
        {answered && (
          <Button onClick={handleNext}>
            {current < qCount - 1 ? "Next question" : "See results"}
          </Button>
        )}
      </div>
      </div>
    </div>
    </div>
  );
}

export default Quiz;
