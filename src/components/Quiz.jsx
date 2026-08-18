import { useState, useEffect, useRef, useCallback } from "react";
import { getSectionById } from "../data/questions";
import {
  QUESTIONS_PER_QUIZ,
  findQuestionById,
  getAnswerFeedback,
  getQuestionBankStatus,
  selectQuizQuestions,
} from "../utils/quiz";
import { playCorrectSound, playWrongSound, playSectionCompleteSound } from "../utils/sounds";
import { ERROR_STATES, PATH_COPY } from "../utils/onboarding";
import { Button, ProgressBar } from "./ui/primitives";
import EmptyState from "./EmptyState";

const OPTIONS_LETTERS = ["A", "B", "C", "D"];

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
  const [pointsEarned, setPointsEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timePerQ);
  const [showHint, setShowHint] = useState(false);
  const [answerLog, setAnswerLog] = useState([]);
  const timerRef = useRef(null);
  const lockedRef = useRef(false);
  const busyRef = useRef(false);
  const finishedRef = useRef(false);

  const qCount = quizQuestions.length;
  const q = quizQuestions[current];
  const questionsDone = Math.min(qCount, current + (answered ? 1 : 0));
  const progress = qCount === 0 ? 0 : (questionsDone / qCount) * 100;

  const lockAnswer = useCallback((option) => {
    if (lockedRef.current || !q) return null;
    const source = findQuestionById(section, q.id);
    const result = getAnswerFeedback(source, option);
    if (!result) {
      lockedRef.current = true;
      clearInterval(timerRef.current);
      setStartError("This question could not be scored. Exit and retry the quiz.");
      setPhase("error");
      return null;
    }
    lockedRef.current = true;
    clearInterval(timerRef.current);
    setSelected(option);
    setFeedback(result);
    setAnswered(true);
    if (result.isCorrect) {
      setCorrectCount((c) => c + 1);
      setPointsEarned((p) => p + pointsPerQ);
      playCorrectSound();
    } else {
      setWrongCount((w) => w + 1);
      playWrongSound();
    }
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
  }, [q, section, pointsPerQ]);

  const handleTimeUp = useCallback(() => {
    if (answered || lockedRef.current) return;
    lockAnswer(null);
  }, [answered, lockAnswer]);

  useEffect(() => {
    if (phase !== "quiz" || answered) return undefined;
    setTimeLeft(timePerQ);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, current, answered, timePerQ, handleTimeUp]);

  function resetAttemptFields() {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setFeedback(null);
    setPointsEarned(0);
    setCorrectCount(0);
    setWrongCount(0);
    setShowHint(false);
    setTimeLeft(timePerQ);
    setAnswerLog([]);
    lockedRef.current = false;
  }

  function startQuiz() {
    if (busyRef.current || !section || !bank.ok) return;
    busyRef.current = true;
    lockedRef.current = false;
    finishedRef.current = false;
    setStartError(null);
    setPhase("loading");
    window.setTimeout(() => {
      const result = selectQuizQuestions(section, { count: QUESTIONS_PER_QUIZ });
      if (!result.ok) {
        setStartError(result.error);
        setQuizQuestions([]);
        setPhase("intro");
        busyRef.current = false;
        return;
      }
      setQuizQuestions(result.questions);
      resetAttemptFields();
      setPhase("quiz");
      busyRef.current = false;
    }, 0);
  }

  function handleSelect(option) {
    if (answered || lockedRef.current || !q) return;
    setSelected(option);
  }

  function handleSubmit() {
    if (answered || lockedRef.current || !q || selected == null) return;
    lockAnswer(selected);
  }

  function handleNext() {
    if (!answered || busyRef.current) return;
    if (current < qCount - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
      setFeedback(null);
      setShowHint(false);
      lockedRef.current = false;
      return;
    }
    if (finishedRef.current) return;
    finishedRef.current = true;
    busyRef.current = true;
    playSectionCompleteSound();
    onComplete({
      sectionId,
      correct: correctCount,
      total: qCount,
      pointsEarned,
      wrong: wrongCount,
    });
    setPhase("results");
    busyRef.current = false;
  }

  useEffect(() => {
    if (phase !== "quiz" || !q) return undefined;
    function onKey(event) {
      if (busyRef.current) return;
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
      <div className="card quiz-intro">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <EmptyState
          variant="error"
          title={ERROR_STATES.quiz.title}
          body="That difficulty is not available. Choose Easy, Medium, or Hard."
          actionLabel="Back to paths"
          onAction={onBack}
        />
      </div>
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
      <div className="card quiz-intro">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <EmptyState
          variant="error"
          title={ERROR_STATES.quiz.title}
          body={startError || ERROR_STATES.quiz.body}
          actionLabel="Back to paths"
          onAction={onBack}
        />
      </div>
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
            actionLabel={bank.ok ? "Try again" : undefined}
            onAction={bank.ok ? startQuiz : undefined}
          />
        )}
        <Button onClick={startQuiz} disabled={!bank.ok}>
          Start quiz
        </Button>
      </div>
    );
  }

  if (phase === "results") {
    const pct = qCount ? Math.round((correctCount / qCount) * 100) : 0;
    const timedOutCount = answerLog.filter((item) => item.timedOut).length;
    const missedCount = answerLog.filter((item) => !item.correct && !item.timedOut).length;
    return (
      <div className="page quiz-results">
        <header className="page-header">
          <p className="kicker">Quiz complete</p>
          <h1>{path.title}</h1>
          <p className="lede">{correctCount} of {qCount} correct · {pct}%</p>
        </header>
        <div className="quiz-score-grid" aria-label="Score breakdown">
          <div className="quiz-score-card">
            <p className="kicker">Correct</p>
            <p className="stat-value">{correctCount}</p>
          </div>
          <div className="quiz-score-card">
            <p className="kicker">Incorrect</p>
            <p className="stat-value">{missedCount}</p>
          </div>
          <div className="quiz-score-card">
            <p className="kicker">Timed out</p>
            <p className="stat-value">{timedOutCount}</p>
          </div>
          <div className="quiz-score-card quiz-score-card-points">
            <p className="kicker">Points earned</p>
            <p className="stat-value">+{pointsEarned}</p>
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
      <div className="card quiz-intro">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <EmptyState
          variant="error"
          title={ERROR_STATES.quiz.title}
          body={`This attempt could not load exactly ${QUESTIONS_PER_QUIZ} questions.`}
          actionLabel="Back"
          onAction={onBack}
        />
      </div>
    );
  }

  const timerPct = timePerQ ? (timeLeft / timePerQ) * 100 : 0;
  const timerUrgent = timeLeft <= 5;
  const resultTitle = feedback?.timedOut ? "Time's up" : feedback?.isCorrect ? "Correct" : "Incorrect";
  const canSubmit = !answered && selected != null;

  return (
    <div className="card quiz-active">
      <div className="quiz-header-row">
        <div>
          <p className="kicker">{path.title}</p>
          <h2>Question {current + 1} of {qCount}</h2>
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
                Question {index + 1}{done ? ", completed" : active ? ", current" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <ProgressBar label={`Progress · ${questionsDone} of ${qCount}`} value={progress} />
      <div className="quiz-session-meta">
        <span>{correctCount} correct</span>
        <span>+{pointsEarned} pts</span>
        <span>{Math.max(0, qCount - questionsDone)} left</span>
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
