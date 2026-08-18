import { useState, useEffect, useRef } from "react";
import { getSectionById } from "../data/questions";
import {
  QUESTIONS_PER_QUIZ,
  canAcceptSubmit,
  findQuestionById,
  getAnswerFeedback,
  getQuestionBankStatus,
  quizProgress,
  selectQuizQuestions,
  summarizeAttempt,
} from "../utils/quiz";
import { playCorrectSound, playWrongSound, playSectionCompleteSound } from "../utils/sounds";
import { ERROR_STATES, PATH_COPY } from "../utils/onboarding";
import { Button, ProgressBar } from "./ui/primitives";
import EmptyState from "./EmptyState";

const OPTIONS_LETTERS = ["A", "B", "C", "D"];

function QuizError({ body, onBack, onRetry }) {
  return (
    <div className="card quiz-intro">
      <Button variant="secondary" onClick={onBack}>Back</Button>
      <EmptyState
        variant="error"
        title={ERROR_STATES.quiz.title}
        body={body}
        actionLabel={onRetry ? "Retry quiz" : "Back to paths"}
        onAction={onRetry || onBack}
      />
    </div>
  );
}

function Quiz({ sectionId, onComplete, onBack }) {
  const section = getSectionById(sectionId);
  const pointsPerQ = section?.pointsPerQuestion ?? 0;
  const timePerQ = section?.timePerQuestion ?? 0;
  const bank = getQuestionBankStatus(section, QUESTIONS_PER_QUIZ);
  const path = PATH_COPY[sectionId] || { kicker: section?.name, title: section?.name };

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
  const progress = quizProgress({ current, answered, total: qCount || QUESTIONS_PER_QUIZ });
  const liveSummary = summarizeAttempt(answerLog, pointsPerQ, QUESTIONS_PER_QUIZ);

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
      const result = selectQuizQuestions(section, { count: QUESTIONS_PER_QUIZ });
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
  }, [phase, section]);

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
    });
    setPhase("results");
  }

  useEffect(() => {
    if (phase !== "quiz" || !q) return undefined;
    function onKey(event) {
      const key = event.key.toLowerCase();
      if (!answered && !lockedRef.current) {
        const idx = OPTIONS_LETTERS.findIndex((letter) => letter.toLowerCase() === key);
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
        body="That difficulty is not available. Choose Easy, Medium, or Hard."
        onBack={onBack}
      />
    );
  }

  if (phase === "loading") {
    return (
      <div className="card quiz-intro" aria-busy="true">
        <p className="kicker">{path.kicker}</p>
        <h2>Preparing quiz</h2>
        <p role="status">Selecting {QUESTIONS_PER_QUIZ} unique questions for {path.title}.</p>
        <div className="quiz-loading-track" aria-hidden="true">
          <div className="quiz-loading-fill" />
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
      <div className="card quiz-intro">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <p className="kicker">{path.kicker}</p>
        <h2>{path.title}</h2>
        <p>{section.description}</p>
        <ul className="quiz-rules">
          <li>{QUESTIONS_PER_QUIZ} unique questions</li>
          <li>{timePerQ} seconds per question</li>
          <li>{pointsPerQ} points per correct answer</li>
          <li>Select an answer, then submit. Explanations appear after you submit</li>
          <li>Retry replaces the previous section score</li>
        </ul>
        {(startError || !bank.ok) && (
          <EmptyState
            variant="error"
            title={ERROR_STATES.quiz.title}
            body={startError || bank.error || ERROR_STATES.quiz.body}
            actionLabel={bank.ok ? "Retry quiz" : "Back to paths"}
            onAction={bank.ok ? startQuiz : onBack}
          />
        )}
        <Button onClick={startQuiz} disabled={!bank.ok}>
          Start quiz
        </Button>
      </div>
    );
  }

  if (phase === "results") {
    const summary = summarizeAttempt(answerLog, pointsPerQ, qCount || QUESTIONS_PER_QUIZ);
    return (
      <div className="page quiz-results">
        <header className="page-header">
          <p className="kicker">Quiz complete</p>
          <h1>{path.title}</h1>
          <p className="lede">{summary.correct} of {summary.total} correct · {summary.percent}%</p>
        </header>
        <div className="quiz-score-grid" aria-label="Score breakdown">
          <div className="quiz-score-card">
            <p className="kicker">Correct</p>
            <p className="stat-value">{summary.correct}</p>
          </div>
          <div className="quiz-score-card">
            <p className="kicker">Incorrect</p>
            <p className="stat-value">{summary.incorrect}</p>
          </div>
          <div className="quiz-score-card">
            <p className="kicker">Timed out</p>
            <p className="stat-value">{summary.timedOut}</p>
          </div>
          <div className="quiz-score-card quiz-score-card-points">
            <p className="kicker">Points earned</p>
            <p className="stat-value">+{summary.pointsEarned}</p>
            <p className="meta-line">{pointsPerQ} pts each</p>
          </div>
        </div>
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
        <div className="quiz-nav quiz-nav-end">
          <Button variant="secondary" onClick={startQuiz}>Retry quiz</Button>
          <Button onClick={onBack}>Continue learning</Button>
        </div>
      </div>
    );
  }

  if (!q || qCount !== QUESTIONS_PER_QUIZ) {
    return (
      <QuizError
        body={`This attempt could not load exactly ${QUESTIONS_PER_QUIZ} questions.`}
        onBack={onBack}
        onRetry={bank.ok ? startQuiz : undefined}
      />
    );
  }

  const timerPct = timePerQ ? (timeLeft / timePerQ) * 100 : 0;
  const timerUrgent = timeLeft <= 5;
  const resultTitle = feedback?.timedOut ? "Time's up" : feedback?.isCorrect ? "Correct" : "Incorrect";
  const canSubmit = canAcceptSubmit({ answered, locked: false, selected });

  return (
    <div className="card quiz-active">
      <div className="quiz-header-row">
        <div>
          <p className="kicker">{path.title}</p>
          <h2>{progress.label}</h2>
        </div>
        <span className="badge">{path.kicker}</span>
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
      <h3 className="question-text">{q.question}</h3>
      {q.hint && !answered && (
        <div className="hint-row">
          <Button variant="secondary" className="btn-hint" onClick={() => setShowHint((s) => !s)}>
            {showHint ? "Hide hint" : "Show hint"}
          </Button>
          {showHint && <div className="hint-text">{q.hint}</div>}
        </div>
      )}
      <div className="options-grid" role="listbox" aria-label="Answer choices">
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
              <span className="option-letter">{OPTIONS_LETTERS[idx]}</span>
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
            : "Select an answer, then submit."}
      </p>
      {answered && feedback && (
        <div className={`quiz-feedback ${feedback.isCorrect ? "" : "quiz-feedback-wrong"}`} role="status">
          <h3>{resultTitle}</h3>
          {!feedback.isCorrect && (
            <p>
              {feedback.timedOut ? "No answer was submitted." : `You chose: ${feedback.selected}`}
              {" "}Correct answer: {feedback.answer}
            </p>
          )}
          {feedback.isCorrect && <p className="meta-line">+{pointsPerQ} points</p>}
          <p>{feedback.explanation}</p>
          {feedback.funFact && <p className="quiz-fun-fact">{feedback.funFact}</p>}
          {feedback.reference && (
            <p>
              <a href={feedback.reference.url} target="_blank" rel="noreferrer">
                Learn more: {feedback.reference.title}
              </a>
            </p>
          )}
        </div>
      )}
      <div className="quiz-nav">
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
  );
}

export default Quiz;
