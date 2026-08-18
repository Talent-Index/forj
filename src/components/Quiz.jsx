import { useState, useEffect, useRef, useCallback } from "react";
import { getSectionById } from "../data/questions";
import { getQuestionBankStatus, QUESTIONS_PER_QUIZ, selectQuizQuestions } from "../utils/quiz";
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
  const [timeLeft, setTimeLeft] = useState(timePerQ);
  const [showHint, setShowHint] = useState(false);
  const [answerLog, setAnswerLog] = useState([]);
  const timerRef = useRef(null);

  const qCount = quizQuestions.length;
  const q = quizQuestions[current];
  const progress = qCount === 0 ? 0 : ((current + (answered ? 1 : 0)) / qCount) * 100;

  const handleTimeUp = useCallback(() => {
    if (answered) return;
    setSelected(null);
    setAnswered(true);
    setWrongCount((w) => w + 1);
    playWrongSound();
    setAnswerLog((log) => [...log, { prompt: q?.question, correct: false }]);
  }, [answered, q]);

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
    setPointsEarned(0);
    setCorrectCount(0);
    setWrongCount(0);
    setShowHint(false);
    setTimeLeft(timePerQ);
    setAnswerLog([]);
    setPhase("quiz");
  }

  function handleAnswer(option) {
    if (answered || !q) return;
    clearInterval(timerRef.current);
    setSelected(option);
    setAnswered(true);
    const isCorrect = option === q.answer;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setPointsEarned((p) => p + pointsPerQ);
      playCorrectSound();
    } else {
      setWrongCount((w) => w + 1);
      playWrongSound();
    }
    setAnswerLog((log) => [...log, { prompt: q.question, correct: isCorrect }]);
  }

  function handleNext() {
    if (current < qCount - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
      setShowHint(false);
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
        if (idx >= 0 && q.options[idx]) handleAnswer(q.options[idx]);
      } else if (key === "enter") {
        handleNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function getButtonClass(option) {
    if (!answered) return "option-btn";
    const classes = ["option-btn", "disabled"];
    if (option === q.answer) classes.push("correct");
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
      {q.hint && (
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
            onClick={() => handleAnswer(option)}
            disabled={answered}
          >
            <span className="option-letter">{OPTIONS_LETTERS[idx]}</span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>
      {answered && (
        <div className={`empty-state ${selected === q.answer ? "" : "empty-state-error"}`}>
          <h3 className="empty-state-title">{selected === q.answer ? "Correct" : "Incorrect"}</h3>
          <p className="empty-state-body">{q.funFact}</p>
        </div>
      )}
      <div className="quiz-nav">
        <button className="btn btn-secondary" onClick={onBack}>Exit</button>
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
