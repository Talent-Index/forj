import {
  INTRODUCTION,
  LEARNING_PROGRESSION,
  DIFFICULTY_LEVELS,
  POINTS_EXPLAINER,
  PUZZLE_EXPLAINER,
  CREDENTIAL_EXPLAINER,
  FUJI_EXPLAINER,
  FIRST_TIME_FLOW,
} from "../utils/onboarding";

function ProductIntro() {
  return (
    <div className="product-intro">
      <section className="landing-hero landing-hero-focus">
        <div className="landing-badge">Avalanche Fuji · Testnet</div>
        <h1 className="landing-title">{INTRODUCTION.title}</h1>
        <p className="landing-tagline">{INTRODUCTION.tagline}</p>
        <p className="landing-subtitle">{INTRODUCTION.body}</p>
        <a className="btn-secondary skip-to-wallet" href="#connect-wallet">
          I already know the loop — connect wallet
        </a>
      </section>

      <section>
        <h2 className="landing-section-title">Learning progression</h2>
        <div className="steps-row">
          {LEARNING_PROGRESSION.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="step-num">Step {step.step}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.body}</p>
              {index < LEARNING_PROGRESSION.length - 1 && (
                <span className="step-arrow" aria-hidden="true">→</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="landing-section-title">Difficulty levels</h2>
        <div className="feature-grid">
          {DIFFICULTY_LEVELS.map((level) => (
            <article className={`feature-card difficulty-${level.id}`} key={level.id}>
              <div className="feature-icon">{level.icon}</div>
              <h3 className="feature-title">{level.name}</h3>
              <p className="feature-desc">{level.description}</p>
              <p className="feature-meta">
                {level.questionsPerQuiz} questions · {level.timePerQuestion}s each · {level.pointsPerQuestion} pts per correct
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="explainers-grid">
        <article className="explainer-card">
          <h3>{POINTS_EXPLAINER.title}</h3>
          <p>{POINTS_EXPLAINER.body}</p>
          <ul>
            {POINTS_EXPLAINER.byDifficulty.map((row) => (
              <li key={row.id}>{row.label}</li>
            ))}
          </ul>
        </article>
        <article className="explainer-card">
          <h3>{PUZZLE_EXPLAINER.title}</h3>
          <p>{PUZZLE_EXPLAINER.body}</p>
        </article>
        <article className="explainer-card">
          <h3>{CREDENTIAL_EXPLAINER.title}</h3>
          <p>{CREDENTIAL_EXPLAINER.body}</p>
          <ul>
            <li>{CREDENTIAL_EXPLAINER.claimed}</li>
            <li>{CREDENTIAL_EXPLAINER.attested}</li>
          </ul>
        </article>
        <article className="explainer-card">
          <h3>{FUJI_EXPLAINER.title}</h3>
          <p>{FUJI_EXPLAINER.body}</p>
          <p>
            <a href={FUJI_EXPLAINER.faucetUrl} target="_blank" rel="noreferrer">
              Get free Fuji test AVAX
            </a>
            {" — "}
            {FUJI_EXPLAINER.faucetHint}
          </p>
        </article>
      </section>

      <section>
        <h2 className="landing-section-title">First-time path</h2>
        <ol className="first-run-steps first-run-steps-static">
          {FIRST_TIME_FLOW.map((step, index) => (
            <li className="first-run-step" key={step.id}>
              <span className="first-run-marker">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default ProductIntro;
