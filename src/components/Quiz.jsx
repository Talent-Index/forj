import { useState, useEffect, useRef, useCallback } from "react";
import { getSectionById } from "../data/questions";
import { playCorrectSound, playWrongSound, playSectionCompleteSound } from "../utils/sounds";

const OPTIONS_LETTERS = ["A", "B", "C", "D"];

function Quiz({ sectionId, onComplete, onBack }) {
  const section = getSectionById(sectionId);
  const questionsPool = section.questions;
  const pointsPerQ = section.pointsPerQuestion;
  const timePerQ = section.timePerQuestion;

  // pick a random subset of 5 questions each quiz attempt
  const [quizQuestions, setQuizQuestions] = useState(() => []);
  const NUM_PER_ATTEMPT = 5;

  const [phase, setPhase] = useState("intro");
  const [current, setCurrent] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQ);
  const [animState, setAnimState] = useState(null);
  const timerRef = useRef(null);

  const qCount = quizQuestions.length || NUM_PER_ATTEMPT;
  const q = quizQuestions[current] || {};
  const progress = ((current + (answered ? 1 : 0)) / qCount) * 100;

  const handleTimeUp = useCallback(() => {
    if (answered) return;
    setSelected(null);
    setAnswered(true);
    setWrongCount((w) => w + 1);
    setAnimState("wrong");
    playWrongSound();
    setTimeout(() => setAnimState(null), 1500);
  }, [answered]);

  useEffect(() => {
    if (phase !== "quiz" || answered) return;

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
    // sample random questions from pool
    const pool = questionsPool.slice();
    const chosen = [];
    while (chosen.length < NUM_PER_ATTEMPT && pool.length > 0) {
      const i = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(i, 1)[0]);
    }
    setQuizQuestions(chosen);
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setPointsEarned(0);
    setCorrectCount(0);
    setWrongCount(0);
    setShowHint(false);
    setPhase("quiz");
  }

  const [showHint, setShowHint] = useState(false);

  function handleAnswer(option) {
    if (answered) return;
    clearInterval(timerRef.current);

    setSelected(option);
    setAnswered(true);

    if (option === q.answer) {
      setCorrectCount((c) => c + 1);
      setPointsEarned((p) => p + pointsPerQ);
      setAnimState("correct");
      playCorrectSound();
    } else {
      setWrongCount((w) => w + 1);
      setAnimState("wrong");
      playWrongSound();
    }
    setTimeout(() => setAnimState(null), 1500);
  }

  function handleNext() {
    if (current < qCount - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
      setShowHint(false);
    } else {
      playSectionCompleteSound();
      onComplete({
        sectionId,
        correct: correctCount,
        total: qCount,
        pointsEarned,
        wrong: wrongCount,
      });
    }
  }

  function getButtonClass(option) {
    if (!answered) return "option-btn";
    const classes = ["option-btn"];
    if (option === q.answer) classes.push("correct");
    else if (option === selected) classes.push("wrong");
    else classes.push("disabled");
    classes.push("disabled");
    return classes.join(" ");
  }

  if (phase === "intro") {
    return (
      <div className="card quiz-intro">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <span className="category-badge">
          <span className="icon">{section.icon}</span>
          {section.name} Mode
        </span>
        <h2>{section.name} Quiz</h2>
        <p>{section.description}</p>
        <ul className="quiz-rules">
          <li>📝 {NUM_PER_ATTEMPT} questions (random)</li>
          <li>⏱️ {timePerQ} seconds per question</li>
          <li>💰 {pointsPerQ} points per correct answer</li>
          <li>🔄 Retry anytime to improve your score</li>
        </ul>
        <button className="btn-primary btn-start" onClick={startQuiz}>
          ▶️ Start Quiz
        </button>
      </div>
    );
  }

  const timerPct = (timeLeft / timePerQ) * 100;
  const timerUrgent = timeLeft <= 5;

  return (
    <div className="card quiz-active">
      {animState === "correct" && (
        <div className="mega-animation mega-correct">
          <span>✅</span>
          <p>CORRECT!</p>
          <p className="mega-sub">+{pointsPerQ} points</p>
        </div>
      )}
      {animState === "wrong" && (
        <div className="mega-animation mega-wrong">
          <span>❌</span>
          <p>WRONG!</p>
          <p className="mega-sub">Keep learning!</p>
        </div>
      )}

      <div className="quiz-header-row">
        <span className="category-badge">
          <span className="icon">{section.icon}</span>
          {section.name}
        </span>
        <div className={`timer ${timerUrgent ? "timer-urgent" : ""}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      <div className="timer-bar">
        <div
          className={`timer-fill ${timerUrgent ? "timer-fill-urgent" : ""}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="progress-container">
        <div className="progress-info">
          <span>Question {current + 1} of {qCount}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <h3 className="question-text">{q.question}</h3>
      {q.hint && (
        <div className="hint-row">
          <button className="btn-hint" onClick={() => setShowHint((s) => !s)}>
            {showHint ? "Hide hint" : "Show hint"}
          </button>
          {showHint && <div className="hint-text">💡 {q.hint}</div>}
        </div>
      )}

      <div className="options-grid">
        {q.options.map((option, idx) => (
          <button
            key={option}
            className={getButtonClass(option)}
            onClick={() => handleAnswer(option)}
            disabled={answered}
          >
            <span className="option-letter">{OPTIONS_LETTERS[idx]}</span>
            <span className="option-text">{option}</span>
            {answered && option === q.answer && <span className="option-check">✅</span>}
            {answered && option === selected && option !== q.answer && <span className="option-check">❌</span>}
          </button>
        ))}
      </div>

      {answered && (
        <div className="fun-fact">
          <strong>💡 Did you know?</strong> {q.funFact}
        </div>
      )}

      <div className="score-row">
        <div className="score-item correct-score">✅ {correctCount} · 💰 {pointsEarned} pts</div>
        <div className="score-item wrong-score">❌ {wrongCount} Wrong</div>
        {answered && (
          <button className="btn-primary btn-next" onClick={handleNext}>
            {current < qCount - 1 ? "Next →" : "🏆 Finish"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Quiz;
