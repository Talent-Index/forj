import { useState } from "react";
import { PRODUCT_LOOP } from "../utils/brand";
import { DIFFICULTY_LEVELS, PATH_COPY } from "../utils/onboarding";
import { BrandMark } from "./brand/ForjoraMark";
import { Button } from "./ui/primitives";
import JigsawBoard from "./JigsawBoard";
import forgeCertificate from "../assets/forge-certificate.jpg";

const HOW_STEPS = [
  {
    n: "01",
    title: "LEARN",
    body: "Explore Avalanche concepts through structured learning.",
  },
  {
    n: "02",
    title: "CHALLENGE",
    body: "Test your knowledge with interactive quizzes.",
  },
  {
    n: "03",
    title: "FORGE",
    body: "Complete your puzzle and earn your credential.",
  },
];

const FORGE_STEPS = [
  "Earn points",
  "Unlock pieces",
  "Complete the puzzle",
  "Reveal your certificate",
];

const PREVIEW_PIECES = [0, 1, 2, 4, 5, 8];

const LEVEL_BODY = {
  easy: "Learn the core concepts behind Avalanche, C-Chain, validators, wallets, and the ecosystem.",
  medium: "Go deeper into validators, C-Chain IDs, Subnet-EVM, ICM, and L1 architecture.",
  hard: "Study Snow protocols, Coreth, Teleporter, ACP-77, and validator economics.",
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
          <p className="landing-kicker">Avalanche learning platform</p>
          <h1 className="landing-display">
            LEARN.
            <br />
            FORGE.
            <br />
            PROVE.
          </h1>
          <p className="landing-loop">{PRODUCT_LOOP}</p>
          <p className="landing-lede">
            Master Avalanche through interactive challenges. Record a claimed score
            on-chain, or wait for an issuer-attested credential.
          </p>
          <div className="landing-hero-actions">
            <Button className="btn-solid" onClick={onStart}>{signedIn ? "Continue Learning →" : "Start Learning →"}</Button>
            {!signedIn && (
              <p className="landing-secondary">
                Already have an account?{" "}
                <button type="button" className="text-link" onClick={onSignIn}>Sign in</button>
              </p>
            )}
          </div>
          <p className="landing-built">Built on Avalanche</p>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <p className="landing-kicker">How Forjora works</p>
        <div className="landing-steps">
          {HOW_STEPS.map((step) => (
            <article key={step.n} className="landing-step">
              <span className="landing-step-n">{step.n}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="learning-levels" className="landing-section">
        <p className="landing-kicker">Learning levels</p>
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
          <p className="landing-kicker">{copy.kicker}</p>
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
          <h2 className="landing-heading">Your progress becomes the certificate.</h2>
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
          <p className="landing-kicker">Forged, not just claimed.</p>
          <h2 className="landing-heading">Your certificate</h2>
          <p>
            A unique certificate is revealed when your puzzle is complete.
            Personalize it with the recipient's name and record your achievement on Avalanche.
          </p>
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
          <Button variant="secondary" onClick={onExploreCredentials}>Explore Credentials →</Button>
        </div>
      </section>

      <section className="landing-finale">
        <div className="landing-finale-inner">
          <h2>Ready to forge?</h2>
          <p>Learn Avalanche. Build your skills. Earn your credential.</p>
          <Button className="btn-solid-inverse" onClick={onStart}>{signedIn ? "Continue Learning →" : "Start Learning →"}</Button>
        </div>
      </section>
    </div>
  );
}

export default Landing;
