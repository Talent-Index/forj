import { useState } from "react";
import { DIFFICULTY_LEVELS, PATH_COPY, FORGE_LEVEL_LABELS } from "../utils/onboarding";
import { BrandMark } from "./brand/ForjoraMark";
import { Button } from "./ui/primitives";
import { Doodle, DoodleField, DoodleDivider } from "./doodles";
import JigsawBoard from "./JigsawBoard";
import forgeCertificate from "../assets/forge-certificate.jpg";

const HERO_DOODLES = [
  { type: "book", top: "6%", left: "5%", size: 38, rotate: -8, decorative: false },
  { type: "pencil", top: "14%", right: "8%", size: 28, rotate: 12 },
  { type: "spark", top: "4%", left: "28%", size: 18, rotate: -14, variant: "accent" },
  { type: "notes", top: "9%", right: "28%", size: 22, rotate: 6 },
  { type: "question", top: "38%", left: "3%", size: 24, rotate: -4 },
  { type: "lightbulb", top: "22%", left: "14%", size: 20, rotate: 10 },
  { type: "diamond", bottom: "20%", right: "7%", size: 32, variant: "accent", accent: true, decorative: false },
  { type: "hammer", bottom: "10%", left: "10%", size: 34, rotate: -6, decorative: false },
  { type: "anvil", bottom: "6%", left: "28%", size: 26, rotate: 4 },
  { type: "puzzle", top: "11%", left: "44%", size: 20, rotate: 8 },
  { type: "certificate", bottom: "26%", left: "5%", size: 26, rotate: -3 },
  { type: "seal", bottom: "18%", left: "22%", size: 20, rotate: 8, variant: "accent" },
  { type: "blockchain", top: "52%", right: "4%", size: 28, rotate: 4 },
  { type: "nodes", top: "68%", right: "14%", size: 24, rotate: -6 },
  { type: "check", bottom: "7%", right: "20%", size: 20, variant: "accent" },
  { type: "code", top: "28%", right: "18%", size: 22, rotate: -8 },
  { type: "gear", top: "44%", right: "24%", size: 18, rotate: 16 },
  { type: "arrow", bottom: "38%", right: "30%", size: 18, rotate: 22 },
  { type: "wallet", top: "62%", left: "6%", size: 22, rotate: -10 },
  { type: "contract", bottom: "32%", right: "5%", size: 24, rotate: 5 },
  { type: "star", top: "34%", left: "24%", size: 16, rotate: -18, variant: "accent" },
  { type: "trophy", bottom: "14%", right: "36%", size: 22, rotate: 7 },
  { type: "fire", top: "72%", left: "18%", size: 20, rotate: -12 },
  { type: "blocks", top: "58%", left: "32%", size: 18, rotate: 9 },
  { type: "blueprint", bottom: "42%", left: "8%", size: 24, rotate: -5 },
  { type: "badge", top: "48%", right: "38%", size: 18, rotate: 14 },
  { type: "mountain", bottom: "8%", left: "42%", size: 22, rotate: 3 },
  { type: "chain", top: "18%", left: "62%", size: 20, rotate: -7 },
  { type: "cap", bottom: "48%", right: "12%", size: 22, rotate: 11 },
  { type: "tools", top: "78%", right: "26%", size: 20, rotate: -9 },
  { type: "circle", top: "8%", right: "42%", size: 14, rotate: 0 },
  { type: "underline", bottom: "55%", left: "40%", size: 28, rotate: -2 },
];

const JOURNEY = [
  {
    n: "01",
    title: "Learn",
    body: "Build your knowledge through structured Avalanche lessons.",
    doodles: ["book", "pencil", "code"],
  },
  {
    n: "02",
    title: "Practice",
    body: "Test your understanding through challenges.",
    doodles: ["quiz", "question", "check"],
  },
  {
    n: "03",
    title: "Forge",
    body: "Turn your progress into track certificates and puzzle pieces.",
    doodles: ["hammer", "anvil", "diamond"],
  },
  {
    n: "04",
    title: "Prove",
    body: "Optionally record a claimed Fuji credential — not an attested exam.",
    doodles: ["certificate", "seal", "blockchain"],
  },
];

const FORGE_STEPS = ["Points", "Pieces", "Puzzle", "Certificate"];
const PREVIEW_PIECES = [0, 1, 2, 4, 5, 8];

const LEVEL_BODY = {
  easy: "Start the fire. Wallets, C-Chain, validators.",
  medium: "Strengthen understanding. Subnets, ICM, L1s.",
  hard: "Prove what you have learned. Snow, Coreth, ACP-77.",
};

const LEVEL_DOODLE = {
  easy: "fire",
  medium: "blocks",
  hard: "hammer",
};

function Landing({ onStart, onSignIn, onExploreCredentials, signedIn = false }) {
  const [levelId, setLevelId] = useState("easy");
  const level = DIFFICULTY_LEVELS.find((item) => item.id === levelId) || DIFFICULTY_LEVELS[0];
  const forgeLabel = FORGE_LEVEL_LABELS[level.id] || level.name;
  const copy = PATH_COPY[level.id];

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <DoodleField items={HERO_DOODLES} />
        <div className="landing-hero-copy">
          <div className="landing-brand">
            <BrandMark className="landing-brand-lockup" showDiamond />
          </div>
          <h1 className="landing-display">
            LEARN.
            <br />
            FORGE.
            <br />
            PROVE.
          </h1>
          <div className="landing-hero-actions">
            <Button className="btn-solid" onClick={onStart}>
              <Doodle type="book" size={16} variant="ink" />
              {signedIn ? "Continue" : "Start"}
            </Button>
            <Button variant="secondary" onClick={onExploreCredentials}>
              <Doodle type="certificate" size={16} variant="muted" />
              Credentials
            </Button>
            {!signedIn && (
              <p className="landing-secondary">
                <button type="button" className="text-link landing-signin-link" onClick={onSignIn}>
                  <Doodle type="arrow" size={12} variant="muted" />
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <p className="landing-kicker">How Forjora works</p>
        <div className="forge-journey">
          {JOURNEY.map((step) => (
            <article key={step.n} className="forge-journey-step">
              <span className="forge-journey-n">{step.n}</span>
              <div className="forge-journey-doodles" aria-hidden="true">
                {step.doodles.map((type) => (
                  <Doodle key={type} type={type} size={28} variant="accent" animated />
                ))}
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
        <DoodleDivider />
      </section>

      <section id="learning-levels" className="landing-section">
        <p className="landing-kicker">Forge levels</p>
        <div className="level-switch" role="tablist" aria-label="Learning levels">
          {DIFFICULTY_LEVELS.map((item) => {
            const label = FORGE_LEVEL_LABELS[item.id] || item.name;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === levelId}
                className={`level-tab ${item.id === levelId ? "is-active sketch-underline" : ""}`}
                onClick={() => setLevelId(item.id)}
              >
                <span className="difficulty-forge-label">
                  <Doodle type={LEVEL_DOODLE[item.id]} size={16} variant="accent" />
                  {label}
                </span>
                <span className="visually-hidden"> ({item.name})</span>
              </button>
            );
          })}
        </div>
        <div className="level-panel">
          <h2>{forgeLabel}</h2>
          <p className="meta-line">{copy.title} · {level.name}</p>
          <p>{LEVEL_BODY[level.id]}</p>
          <p className="meta-line">{level.questionsPerQuiz} questions</p>
          <Button className="btn-solid" onClick={onStart}>
            Start {forgeLabel} →
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
                {index < FORGE_STEPS.length - 1 && (
                  <span className="forge-arrow" aria-hidden="true">
                    <Doodle type="arrowDown" size={18} variant="muted" />
                  </span>
                )}
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
              <dt>Forjora claimed</dt>
              <dd>You published your own scores on Fuji.</dd>
            </div>
            <div className="credential-path-attested">
              <dt>Forjora issuer-attested</dt>
              <dd>An issuer authorized that record with a signature.</dd>
            </div>
          </dl>
          <Button variant="secondary" onClick={onExploreCredentials}>
            <Doodle type="certificate" size={14} variant="muted" />
            Credentials
          </Button>
        </div>
      </section>

      <section className="landing-finale">
        <div className="landing-finale-inner">
          <Doodle type="hammer" size={36} variant="accent" animated />
          <h2>Ready to forge?</h2>
          <Button className="btn-solid-inverse" onClick={onStart}>
            <Doodle type="book" size={16} variant="ink" />
            {signedIn ? "Continue" : "Start"}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Landing;
