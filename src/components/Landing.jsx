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
  buildDenseDoodleField,
} from "./doodles";
import JigsawBoard from "./JigsawBoard";
import forgeCertificate from "../assets/forge-certificate.jpg";

const HERO_CURATED = [
  { type: "pencil", top: "6%", left: "4%", size: 28, rotate: -8, decorative: false, animation: "slide", delay: 80 },
  { type: "underline", top: "11%", left: "12%", size: 34, animation: "underline", delay: 160 },
  { type: "book", top: "5%", right: "6%", size: 30, rotate: 7, decorative: false, animation: "open", delay: 220 },
  { type: "spark", top: "3%", left: "28%", size: 16, rotate: -12, variant: "accent", accent: true, animation: "spark", delay: 100 },
  { type: "notes", top: "8%", right: "24%", size: 20, rotate: 5, animation: "draw", delay: 280 },
  { type: "lightbulb", top: "18%", left: "7%", size: 22, rotate: 8, animation: "draw", delay: 340 },
  { type: "code", top: "16%", right: "14%", size: 22, rotate: -6, animation: "draw", delay: 400 },
  { type: "question", top: "36%", left: "3%", size: 24, rotate: -4, decorative: false, animation: "wiggle", delay: 480 },
  { type: "cap", top: "28%", right: "4%", size: 22, rotate: 10, animation: "draw", delay: 520 },
  { type: "hammer", bottom: "14%", left: "6%", size: 28, rotate: -6, decorative: false, animation: "tap", delay: 720 },
  { type: "diamond", bottom: "12%", right: "6%", size: 28, variant: "accent", accent: true, decorative: false, animation: "draw", delay: 840 },
  { type: "certificate", top: "48%", right: "3%", size: 24, rotate: -7, animation: "stamp", delay: 880 },
  { type: "seal", bottom: "28%", right: "12%", size: 20, rotate: 8, variant: "accent", accent: true, animation: "stamp", delay: 920 },
  { type: "blockchain", top: "62%", right: "5%", size: 26, rotate: 4, animation: "connect", delay: 1000 },
  { type: "puzzle", top: "14%", left: "48%", size: 18, rotate: 9, animation: "assemble", delay: 440 },
  { type: "star", top: "26%", right: "32%", size: 16, rotate: 15, variant: "accent", accent: true, animation: "spark", delay: 300 },
];

const HERO_DOODLES = buildDenseDoodleField({
  seed: "landing-hero",
  theme: "landing",
  count: 128,
  curated: HERO_CURATED,
  animateCount: 24,
});

const JOURNEY_DOODLES = buildDenseDoodleField({
  seed: "landing-journey",
  theme: "learn",
  count: 108,
  curated: [
    { type: "book", top: "8%", left: "4%", size: 22, rotate: -6, animation: "open", delay: 0, decorative: false },
    { type: "pencil", top: "12%", right: "6%", size: 18, rotate: 10, animation: "slide", delay: 120, decorative: false },
    { type: "question", bottom: "18%", left: "8%", size: 18, animation: "wiggle", delay: 240, decorative: false },
    { type: "hammer", bottom: "12%", right: "10%", size: 22, rotate: -5, animation: "tap", delay: 360, decorative: false },
    { type: "certificate", top: "40%", right: "4%", size: 18, animation: "stamp", delay: 480 },
    { type: "check", bottom: "8%", left: "30%", size: 16, variant: "accent", accent: true, animation: "draw", delay: 600 },
  ],
  animateCount: 14,
});

const LEVEL_FIELD = buildDenseDoodleField({
  seed: "landing-levels",
  theme: "quiz",
  count: 104,
  curated: [
    { type: "fire", top: "6%", left: "6%", size: 18, rotate: -8, animation: "spark", delay: 0, decorative: false },
    { type: "blocks", top: "8%", right: "8%", size: 18, rotate: 6, animation: "assemble", delay: 100, decorative: false },
    { type: "hammer", bottom: "10%", left: "10%", size: 18, rotate: -4, animation: "tap", delay: 200, decorative: false },
  ],
  animateCount: 12,
});

const FORGE_FIELD = buildDenseDoodleField({
  seed: "landing-forge",
  theme: "puzzle",
  count: 104,
  curated: [
    { type: "hammer", top: "10%", left: "5%", size: 22, rotate: -6, animation: "tap", delay: 0, decorative: false },
    { type: "anvil", bottom: "12%", left: "8%", size: 20, animation: "draw", delay: 140, decorative: false },
    { type: "diamond", top: "14%", right: "8%", size: 20, variant: "accent", accent: true, animation: "draw", delay: 280, decorative: false },
    { type: "puzzle", bottom: "20%", right: "10%", size: 18, animation: "assemble", delay: 420 },
  ],
  animateCount: 12,
});

const CREDENTIAL_FIELD = buildDenseDoodleField({
  seed: "landing-credential",
  theme: "credentials",
  count: 104,
  curated: [
    { type: "certificate", top: "10%", left: "8%", size: 22, animation: "stamp", delay: 0, decorative: false },
    { type: "seal", top: "12%", right: "10%", size: 20, variant: "accent", accent: true, animation: "stamp", delay: 160, decorative: false },
    { type: "blockchain", bottom: "16%", left: "12%", size: 24, animation: "connect", delay: 320, decorative: false },
    { type: "nodes", bottom: "12%", right: "14%", size: 20, animation: "connect", delay: 480 },
  ],
  animateCount: 12,
});

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

const FORGE_STEPS = ["XP", "Pieces", "Puzzle", "Credential"];
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
        <DoodleField items={HERO_DOODLES} dense animate trigger="immediate" />
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
            <button
              type="button"
              className="landing-cta-primary"
              onClick={onStart}
              aria-label={signedIn ? "Continue" : "Start"}
              title={signedIn ? "Continue" : "Start"}
            >
              <AnimatedDoodle type="door" animation="draw" trigger="immediate" size={20} variant="accent" delay={doodleTiming.draw} />
              <span className="visually-hidden">{signedIn ? "Continue" : "Start"}</span>
            </button>
            <button
              type="button"
              className="landing-cta-quiet"
              onClick={onExploreCredentials}
              aria-label="Credentials"
              title="Credentials"
            >
              <AnimatedDoodle type="certificate" animation="draw" trigger="immediate" size={18} variant="muted" delay={doodleTiming.draw + 120} />
              <span className="visually-hidden">Credentials</span>
            </button>
            {!signedIn && (
              <button
                type="button"
                className="landing-cta-quiet"
                onClick={onSignIn}
                aria-label="Sign in"
                title="Sign in"
              >
                <AnimatedDoodle type="wallet" animation="draw" trigger="immediate" size={16} variant="muted" delay={doodleTiming.draw + 200} />
                <span className="visually-hidden">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <DoodleField items={JOURNEY_DOODLES} dense animate trigger="viewport" />
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
        <DoodleField items={LEVEL_FIELD} dense animate trigger="viewport" />
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
            <AnimatedDoodle type="door" animation="draw" trigger="immediate" size={16} variant="accent" delay={400} />
          </button>
          <span className="level-panel-note" aria-hidden="true">
            <AnimatedDoodle type="pencil" animation="slide" trigger="immediate" size={18} variant="muted" delay={520} />
          </span>
        </div>
      </section>

      <section id="the-forge" className="landing-section landing-split">
        <DoodleField items={FORGE_FIELD} dense animate trigger="viewport" />
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
        <DoodleField items={CREDENTIAL_FIELD} dense animate trigger="viewport" />
        <div>
          <h2 className="landing-heading">Your credential</h2>
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
    </div>
  );
}

export default Landing;
