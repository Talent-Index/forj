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

  const qCount = quizQuestions.length;
  const q = quizQuestions[current];
  const progress = qCount === 0 ? 0 : ((current + (answered ? 1 : 0)) / qCount) * 100;

  const lockAnswer = useCallback((option) => {
    if (lockedRef.current || !q) return null;
    const source = findQuestionById(section, q.id);
    const result = getAnswerFeedback(source, option);
    if (!result) return null;
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
    setAnswerLog((log) => [...log, { prompt: q.question, correct: result.isCorrect }]);
    return result;
  }, [q, section, pointsPerQ]);

  const handleTimeUp = useCallback(() => {
    if (answered) return;
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

  function startQuiz() {
    const result = selectQuizQuestions(section, { count: QUESTIONS_PER_QUIZ });
    if (!result.ok) {
      setStartError(result.error);
      setQuizQuestions([]);
      setPhase("intro");
      return;
    }
    setStartError(null);
    setQuizQuestions(result.questions);
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
    setPhase("quiz");
  }

  function handleSelect(option) {
    if (answered || !q) return;
    setSelected(option);
  }

  function handleSubmit() {
    if (answered || !q || selected == null) return;
    lockAnswer(selected);
  }

  function handleNext() {
    if (current < qCount - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
      setFeedback(null);
      setShowHint(false);
      lockedRef.current = false;
      return;
    }
    playSectionCompleteSound();
    onComplete({
      sectionId,
      correct: correctCount,
      total: qCount,
      pointsEarned,
      wrong: wrongCount,
    });
    setPhase("results");
  }

  useEffect(() => {
    if (phase !== "quiz" || !q) return undefined;
    function onKey(event) {
      const key = event.key.toLowerCase();
      if (!answered) {
        const idx = OPTIONS_LETTERS.findIndex((letter) => letter.toLowerCase() === key);
        if (idx >= 0 && q.options[idx]) handleSelect(q.options[idx]);
        if (key === "enter") handleSubmit();
      } else if (key === "enter") {
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
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
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

  if (phase === "intro") {
    return (
      <div className="card quiz-intro">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
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
          />
        )}
        <button className="btn btn-primary" onClick={startQuiz} disabled={!bank.ok}>
          Start quiz
        </button>
      </div>
    );
  }

  if (phase === "results") {
    const pct = qCount ? Math.round((correctCount / qCount) * 100) : 0;
    return (
      <div className="card quiz-intro">
        <p className="kicker">Quiz complete</p>
        <h2>{correctCount} / {qCount} correct</h2>
        <p>{pct}% · +{pointsEarned} points · {path.kicker}</p>
        <h3>Question performance</h3>
        <ul className="results-list">
          {answerLog.map((item, index) => (
            <li key={`${item.prompt}-${index}`}>
              {item.correct ? "✓" : "✕"} Question {index + 1}
            </li>
          ))}
        </ul>
        <div className="hero-actions">
          <button className="btn btn-secondary" onClick={startQuiz}>Retry quiz</button>
          <button className="btn btn-primary" onClick={onBack}>Continue learning</button>
        </div>
      </div>
    );
  }

  if (!q || qCount !== QUESTIONS_PER_QUIZ) {
    return (
      <div className="card quiz-intro">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
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

  const timerPct = (timeLeft / timePerQ) * 100;
  const timerUrgent = timeLeft <= 5;
  const resultTitle = feedback?.timedOut ? "Time's up" : feedback?.isCorrect ? "Correct" : "Incorrect";

  return (
    <div className="card quiz-active">
      <div className="quiz-header-row">
        <div>
          <p className="kicker">{path.title}</p>
          <h2>Question {current + 1} of {qCount}</h2>
        </div>
        <span className="badge">{path.kicker} · {timeLeft}s</span>
      </div>
      <div className="timer-bar">
        <div className={`timer-fill ${timerUrgent ? "timer-fill-urgent" : ""}`} style={{ width: `${timerPct}%` }} />
      </div>
      <div className="progress-container">
        <div className="progress-info">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <h3 className="question-text">{q.question}</h3>
      {q.hint && !answered && (
        <div className="hint-row">
          <button className="btn btn-secondary btn-hint" onClick={() => setShowHint((s) => !s)}>
            {showHint ? "Hide hint" : "Show hint"}
          </button>
          {showHint && <div className="hint-text">{q.hint}</div>}
        </div>
      )}
      <div className="options-grid">
        {q.options.map((option, idx) => (
          <button
            key={`${q.id}-${idx}`}
            className={getButtonClass(option)}
            onClick={() => handleSelect(option)}
            disabled={answered}
            aria-pressed={!answered && option === selected}
          >
            <span className="option-letter">{OPTIONS_LETTERS[idx]}</span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>
      {answered && feedback && (
        <div className={`quiz-feedback ${feedback.isCorrect ? "" : "quiz-feedback-wrong"}`}>
          <h3>{resultTitle}</h3>
          {!feedback.isCorrect && (
            <p>
              {feedback.timedOut ? "No answer was submitted." : `You chose: ${feedback.selected}`}
              {" "}Correct answer: {feedback.answer}
            </p>
          )}
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
        <button className="btn btn-secondary" onClick={onBack}>Exit</button>
        {!answered && (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={selected == null}>
            Submit answer
          </button>
        )}
        {answered && (
          <button className="btn btn-primary" onClick={handleNext}>
            {current < qCount - 1 ? "Next question" : "See results"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Quiz;
