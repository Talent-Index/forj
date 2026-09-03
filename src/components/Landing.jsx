import { useState } from "react";
import { DIFFICULTY_LEVELS, PATH_COPY } from "../utils/onboarding";
import { BrandMark } from "./brand/ForjoraMark";
import { Button } from "./ui/primitives";
import { Icon } from "./ui/Icon";
import JigsawBoard from "./JigsawBoard";
import forgeCertificate from "../assets/forge-certificate.jpg";

const HOW_STEPS = [
  { n: "01", icon: "learn", title: "Learn" },
  { n: "02", icon: "progress", title: "Challenge" },
  { n: "03", icon: "badge", title: "Forge" },
];

const FORGE_STEPS = ["Points", "Pieces", "Puzzle", "Certificate"];

const PREVIEW_PIECES = [0, 1, 2, 4, 5, 8];

const LEVEL_BODY = {
  easy: "Wallets, C-Chain, validators.",
  medium: "Subnets, ICM, L1s.",
  hard: "Snow, Coreth, ACP-77.",
};

function Landing({ onStart, onSignIn, onExploreCredentials, signedIn = false }) {
  const [levelId, setLevelId] = useState("easy");
  const level = DIFFICULTY_LEVELS.find((item) => item.id === levelId) || DIFFICULTY_LEVELS[0];
  const copy = PATH_COPY[level.id];

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-brand">
            <BrandMark className="landing-brand-lockup" />
          </div>
          <h1 className="landing-display">
            LEARN.
            <br />
            FORGE.
            <br />
            PROVE.
          </h1>
          <p className="landing-lede">
            Study Avalanche. Record a claimed score, or wait for an issuer-attested credential.
          </p>
          <div className="landing-hero-actions">
            <Button className="btn-solid" onClick={onStart}>
              <Icon name="learn" size={16} />
              {signedIn ? "Continue Learning →" : "Start Learning →"}
            </Button>
            {!signedIn && (
              <p className="landing-secondary">
                <button type="button" className="text-link" onClick={onSignIn}>Sign in</button>
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="landing-steps">
          {HOW_STEPS.map((step) => (
            <article key={step.n} className="landing-step">
              <Icon name={step.icon} size={22} />
              <h2>{step.title}</h2>
            </article>
          ))}
        </div>
      </section>

      <section id="learning-levels" className="landing-section">
        <p className="landing-kicker">Levels</p>
        <div className="level-switch" role="tablist" aria-label="Learning levels">
          {DIFFICULTY_LEVELS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === levelId}
              className={`level-tab ${item.id === levelId ? "is-active" : ""}`}
              onClick={() => setLevelId(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="level-panel">
          <h2>{copy.title}</h2>
          <p>{LEVEL_BODY[level.id]}</p>
          <p className="meta-line">{level.questionsPerQuiz} questions</p>
          <Button className="btn-solid" onClick={onStart}>
            Start {level.name} Quiz →
          </Button>
        </div>
      </section>

      <section id="the-forge" className="landing-section landing-split">
        <div>
          <h2 className="landing-heading">Progress becomes the certificate.</h2>
          <ol className="forge-ladder">
            {FORGE_STEPS.map((step, index) => (
              <li key={step}>
                <span>{step}</span>
                {index < FORGE_STEPS.length - 1 && <span className="forge-arrow" aria-hidden="true">↓</span>}
              </li>
            ))}
          </ol>
        </div>
        <div className="landing-puzzle" aria-hidden="true">
          <JigsawBoard
            artwork={forgeCertificate}
            acquiredPieces={PREVIEW_PIECES}
            showLabels={false}
          />
        </div>
      </section>

      <section id="credential" className="landing-section landing-credential">
        <div>
          <h2 className="landing-heading">Your certificate</h2>
          <dl className="credential-distinction">
            <div className="credential-path-claimed">
              <dt>Claimed</dt>
              <dd>User-recorded achievement.</dd>
            </div>
            <div className="credential-path-attested">
              <dt>Attested</dt>
              <dd>Issuer-authorized achievement.</dd>
            </div>
          </dl>
          <Button variant="secondary" onClick={onExploreCredentials}>
            Explore Credentials →
          </Button>
        </div>
      </section>

      <section className="landing-finale">
        <div className="landing-finale-inner">
          <h2>Ready to forge?</h2>
          <Button className="btn-solid-inverse" onClick={onStart}>
            {signedIn ? "Continue Learning →" : "Start Learning →"}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Landing;
