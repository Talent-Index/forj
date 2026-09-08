import { TRACKS } from "../../data/learning";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "../../utils/brand";
import { CONTRACT_ADDRESS } from "../../utils/contract";
import { CREDENTIAL_STATES } from "../../utils/credentialStatus";
import {
  CREDENTIAL_EXPLAINER,
  FUJI_EXPLAINER,
  INTRODUCTION,
  LEARNING_PROGRESSION,
  POINTS_EXPLAINER,
  WALLET_GUIDANCE,
} from "../../utils/onboarding";
import CredentialStatusBadge from "../CredentialStatusBadge";
import { Button, Card } from "../ui/primitives";
import { Doodle, DoodleDivider } from "../doodles";
import { safeExternalHref } from "../../utils/frontendSecurity";

const CONTRACT_EXPLORER = CONTRACT_ADDRESS
  ? `https://testnet.snowtrace.io/address/${CONTRACT_ADDRESS}`
  : "";

const SKETCH_FLOW = [
  { label: "Learn", doodle: "book" },
  { label: "Practice", doodle: "quiz" },
  { label: "Achieve", doodle: "trophy" },
  { label: "Forge", doodle: "hammer" },
  { label: "Prove", doodle: "certificate" },
];

const ACCOUNT_POINTS = [
  {
    title: "Account",
    body: "Email or Google holds progress, XP, puzzle pieces, and streaks across devices. Email verification is required before the learning record is treated as signed in.",
  },
  {
    title: "Wallet",
    body: WALLET_GUIDANCE.body,
  },
];

function AboutPage({ onNavigate, isAuthenticated = false }) {
  return (
    <div className="page about-page about-sketch">
      <header className="page-header">
        <h1>{INTRODUCTION.title}</h1>
        <p className="lede">{INTRODUCTION.body}</p>
        <div className="about-header-actions">
          <Button onClick={() => onNavigate?.("learn")}>
            {isAuthenticated ? "Continue" : "Start"}
            <Doodle type="arrow" size={14} variant="ink" />
          </Button>
          <Button variant="secondary" onClick={() => onNavigate?.("lookup")}>
            Look up a credential
          </Button>
        </div>
      </header>

      <section className="section-block about-loop-section">
        <h2>The loop</h2>
        <p className="about-section-lede">
          {PRODUCT_TAGLINE} A claimed mint is not an independently assessed exam.
        </p>
        <ol className="about-sketch-flow" aria-label="Learning loop">
          {SKETCH_FLOW.map((step, index) => (
            <li key={step.label}>
              <div className="about-sketch-step">
                <Doodle type={step.doodle} size={28} variant="accent" animated />
                <span>{step.label}</span>
              </div>
              {index < SKETCH_FLOW.length - 1 ? (
                <span className="about-sketch-arrow" aria-hidden="true">
                  <Doodle type="arrow" size={14} variant="muted" />
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <DoodleDivider />
        <ol className="about-loop">
          {LEARNING_PROGRESSION.map((step) => (
            <li key={step.step}>
              <span className="about-loop-n" aria-hidden="true">
                <Doodle
                  type={["book", "quiz", "spark", "puzzle", "certificate"][step.step - 1] || "circle"}
                  size={20}
                  variant="accent"
                />
              </span>
              <div className="about-loop-copy">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="note about-section-note">{POINTS_EXPLAINER.body}</p>
      </section>

      <section className="section-block about-tracks-section">
        <h2>Tracks</h2>
        <p className="about-section-lede">
          Six Avalanche tracks, in order. Quizzes sit on Fundamentals, Architecture, and Developer.
        </p>
        <div className="about-tracks">
          {TRACKS.map((track) => (
            <article key={track.id} className="about-track">
              <p className="kicker">{track.difficulty}</p>
              <h3>{track.name}</h3>
              <p>{track.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block about-pair-section">
        <h2>Account</h2>
        <div className="split about-pair">
          {ACCOUNT_POINTS.map((item) => (
            <Card key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-block about-pair-section">
        <h2>{CREDENTIAL_EXPLAINER.title}</h2>
        <p className="about-section-lede">{CREDENTIAL_EXPLAINER.body}</p>
        <div className="split about-pair">
          <Card className="credential-path-claimed">
            <CredentialStatusBadge status={CREDENTIAL_STATES.claimed} />
            <h3>{CREDENTIAL_STATES.claimed.title}</h3>
            <p>{CREDENTIAL_EXPLAINER.claimed}</p>
            <p className="note">{CREDENTIAL_STATES.claimed.body}</p>
          </Card>
          <Card className="credential-path-attested">
            <CredentialStatusBadge status={CREDENTIAL_STATES.attested} />
            <h3>{CREDENTIAL_STATES.attested.title}</h3>
            <p>{CREDENTIAL_EXPLAINER.attested}</p>
            <p className="note">{CREDENTIAL_STATES.attested.body}</p>
          </Card>
        </div>
        <p className="note about-section-note">
          {PRODUCT_NAME} does not issue credentials on Avalanche C-Chain today. Issuer-attested mint
          is contract-ready and is not the default learner button.
        </p>
      </section>

      <section className="section-block about-closing-section">
        <h2>{FUJI_EXPLAINER.title}</h2>
        <p className="about-section-lede">{FUJI_EXPLAINER.body}</p>
        <p className="about-section-lede">
          <a href={safeExternalHref(FUJI_EXPLAINER.faucetUrl)} target="_blank" rel="noopener noreferrer">Get Fuji test AVAX</a>
          {" — "}
          {FUJI_EXPLAINER.faucetHint}
        </p>
        {CONTRACT_EXPLORER ? (
          <p className="note about-section-note">
            Live Fuji credential contract:{" "}
            <a href={safeExternalHref(CONTRACT_EXPLORER)} target="_blank" rel="noopener noreferrer">
              View on Snowtrace
            </a>
            . Explorer links show that a token exists. They do not mean an issuer reviewed the score.
          </p>
        ) : null}
      </section>

      <section className="section-block about-closing-section">
        <h2>Look up a credential</h2>
        <p className="about-section-lede">
          Anyone can open Lookup and read a Fuji record by credential ID or holder wallet, signed in
          or out. A found record is an on-chain snapshot. Looking it up does not make a Forjora
          claimed score issuer-attested.
        </p>
        <Button variant="secondary" onClick={() => onNavigate?.("lookup")}>
          Open lookup
        </Button>
      </section>

      <section className="section-block about-closing-section">
        <h2>Board</h2>
        <p className="about-section-lede">
          Community ranking from first-time learning events. Not on-chain, not issuer-attested,
          not a proctored exam. Hide on the Board page anytime.
        </p>
      </section>
    </div>
  );
}

export default AboutPage;
