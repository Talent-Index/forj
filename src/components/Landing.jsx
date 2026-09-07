import { useState } from "react";
import { DIFFICULTY_LEVELS, PATH_COPY, FORGE_LEVEL_LABELS } from "../utils/onboarding";
import { BrandMark } from "./brand/ForjoraMark";
import { Button } from "./ui/primitives";
import {
  AnimatedDoodle,
  BlockchainConnect,
  DoodleArrow,
  DoodleField,
  DoodleDivider,
  DoodleText,
  doodleTiming,
} from "./doodles";
import JigsawBoard from "./JigsawBoard";
import forgeCertificate from "../assets/forge-certificate.jpg";

const HERO_DOODLES = [
  {
    type: "pencil",
    top: "10%",
    left: "8%",
    size: 26,
    rotate: -6,
    decorative: false,
    animation: "slide",
    delay: doodleTiming.stagger,
  },
  {
    type: "underline",
    top: "16%",
    left: "14%",
    size: 36,
    animation: "underline",
    delay: doodleTiming.stagger * 2,
  },
  {
    type: "book",
    top: "12%",
    right: "10%",
    size: 28,
    rotate: 6,
    decorative: false,
    animation: "open",
    delay: doodleTiming.stagger * 3,
  },
  {
    type: "question",
    top: "48%",
    left: "5%",
    size: 22,
    rotate: -4,
    animation: "wiggle",
    delay: doodleTiming.stagger * 5,
  },
  {
    type: "diamond",
    bottom: "16%",
    right: "9%",
    size: 26,
    variant: "accent",
    accent: true,
    decorative: false,
    animation: "draw",
    delay: doodleTiming.stagger * 7,
  },
  {
    type: "certificate",
    top: "46%",
    right: "5%",
    size: 22,
    rotate: -8,
    animation: "stamp",
    delay: doodleTiming.stagger * 9,
  },
  {
    type: "check",
    bottom: "22%",
    right: "16%",
    size: 18,
    variant: "accent",
    accent: true,
    animation: "draw",
    delay: doodleTiming.stagger * 11,
  },
  {
    type: "hammer",
    bottom: "12%",
    left: "9%",
    size: 24,
    rotate: -4,
    animation: "tap",
    delay: doodleTiming.stagger * 8,
  },
];

const JOURNEY = [
  {
    n: "01",
    title: "Learn",
    body: "Build your knowledge through structured Avalanche lessons.",
    type: "book",
    animation: "open",
  },
  {
    n: "02",
    title: "Practice",
    body: "Test your understanding through challenges.",
    type: "question",
    animation: "wiggle",
  },
  {
    n: "03",
    title: "Forge",
    body: "Turn your progress into track certificates and puzzle pieces.",
    type: "hammer",
    animation: "tap",
  },
  {
    n: "04",
    title: "Prove",
    body: "Optionally record a claimed Fuji credential — not an attested exam.",
    type: "certificate",
    animation: "stamp",
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
        <DoodleField items={HERO_DOODLES} animate trigger="immediate" />
        <div className="landing-hero-copy">
          <div className="landing-brand">
            <BrandMark className="landing-brand-lockup" showDiamond />
          </div>
          <h1 className="landing-display">
            <DoodleText mark="underline" trigger="immediate" delay={doodleTiming.stagger * 2}>
              LEARN.
            </DoodleText>
            <br />
            <DoodleText mark="underline" trigger="immediate" delay={doodleTiming.stagger * 4}>
              FORGE.
            </DoodleText>
            <br />
            <DoodleText mark="underline" trigger="immediate" delay={doodleTiming.stagger * 6}>
              PROVE.
            </DoodleText>
          </h1>
          <div className="landing-hero-actions">
            <button type="button" className="landing-cta-primary" onClick={onStart}>
              <AnimatedDoodle type="arrow" animation="draw" trigger="immediate" size={14} variant="accent" delay={doodleTiming.draw} />
              <span>{signedIn ? "Continue" : "Start"}</span>
            </button>
            <button type="button" className="landing-cta-quiet" onClick={onExploreCredentials}>
              <AnimatedDoodle type="certificate" animation="draw" trigger="immediate" size={14} variant="muted" delay={doodleTiming.draw + 120} />
              <span>Credentials</span>
            </button>
            {!signedIn && (
              <button type="button" className="landing-cta-quiet" onClick={onSignIn}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <p className="landing-kicker">How Forjora works</p>
        <div className="forge-journey">
          {JOURNEY.map((step, index) => (
            <article key={step.n} className="forge-journey-step">
              <span className="forge-journey-n">{step.n}</span>
              <div className="forge-journey-doodles" aria-hidden="true">
                <AnimatedDoodle
                  type={step.type}
                  animation={step.animation}
                  trigger="viewport"
                  size={32}
                  variant="accent"
                  delay={index * doodleTiming.stagger}
                />
              </div>
              <h3>
                <DoodleText trigger="viewport" delay={index * doodleTiming.stagger}>
                  {step.title}
                </DoodleText>
              </h3>
              <p>{step.body}</p>
              {index < JOURNEY.length - 1 ? (
                <DoodleArrow
                  className="forge-journey-arrow"
                  trigger="viewport"
                  delay={(index + 1) * doodleTiming.stagger}
                />
              ) : null}
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
                className={`level-tab ${item.id === levelId ? "is-active" : ""}`}
                onClick={() => setLevelId(item.id)}
              >
                <span className="difficulty-forge-label">
                  <AnimatedDoodle
                    type={LEVEL_DOODLE[item.id]}
                    animation="draw"
                    trigger="hover"
                    once={false}
                    size={16}
                    variant={item.id === levelId ? "accent" : "muted"}
                  />
                  {label}
                </span>
                <span className="visually-hidden"> ({item.name})</span>
              </button>
            );
          })}
        </div>
        <div key={level.id} className={`level-panel level-panel-${level.id}`}>
          <div className="level-panel-margin" aria-hidden="true">
            <AnimatedDoodle
              type={LEVEL_DOODLE[level.id]}
              animation={level.id === "easy" ? "spark" : level.id === "hard" ? "tap" : "assemble"}
              stages={level.id === "easy" ? ["draw", "spark"] : ["draw"]}
              trigger="immediate"
              size={48}
              variant="accent"
            />
          </div>
          <p className="level-panel-kicker">
            {copy.title}
            <span aria-hidden="true"> · </span>
            {level.name}
          </p>
          <h2 className="level-panel-title">
            <DoodleText mark="underline" trigger="immediate" delay={120}>
              {forgeLabel}
            </DoodleText>
          </h2>
          <p className="level-panel-body">{LEVEL_BODY[level.id]}</p>
          <p className="level-panel-meta">
            <AnimatedDoodle type="quiz" animation="draw" trigger="immediate" size={14} variant="muted" delay={280} />
            {level.questionsPerQuiz} questions
          </p>
          <button type="button" className="level-panel-cta" onClick={onStart}>
            <span>Start {forgeLabel}</span>
            <AnimatedDoodle type="arrow" animation="draw" trigger="immediate" size={16} variant="accent" delay={400} />
          </button>
          <span className="level-panel-note" aria-hidden="true">
            <AnimatedDoodle type="pencil" animation="slide" trigger="immediate" size={18} variant="muted" delay={520} />
          </span>
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
                    <AnimatedDoodle type="arrowDown" animation="draw" trigger="viewport" size={18} variant="muted" />
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
          <BlockchainConnect trigger="viewport" label="On-chain record" showCheck />
          <Button variant="secondary" onClick={onExploreCredentials}>
            <AnimatedDoodle type="certificate" animation="draw" trigger="viewport" size={14} variant="muted" />
            Credentials
          </Button>
        </div>
      </section>

      <section className="landing-finale">
        <div className="landing-finale-inner">
          <AnimatedDoodle type="hammer" animation="tap" trigger="viewport" size={36} variant="accent" />
          <h2>
            <DoodleText trigger="viewport">Ready to forge?</DoodleText>
          </h2>
          <Button className="btn-solid-inverse" onClick={onStart}>
            <AnimatedDoodle type="book" animation="draw" trigger="viewport" size={16} variant="ink" />
            {signedIn ? "Continue" : "Start"}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default Landing;
