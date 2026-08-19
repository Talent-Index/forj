import { DIFFICULTY_LEVELS, PATH_COPY, PUZZLE_EXPLAINER } from "../utils/onboarding";
import { CREDENTIAL_STATES } from "../utils/credentialStatus";
import { TOTAL_PIECES } from "../data/questions";
import { Badge, Button, Card } from "./ui/primitives";
import CredentialStatusBadge from "./CredentialStatusBadge";

const LOOP = ["Learn", "Quiz", "Earn points", "Unlock", "Credential"];
const HOW = [
  { n: "01", title: "Learn", body: "Explore Avalanche concepts and ecosystem fundamentals." },
  { n: "02", title: "Challenge", body: "Test your knowledge through Easy, Medium, and Hard quizzes." },
  { n: "03", title: "Progress", body: "Earn points, unlock puzzle pieces, and complete learning paths." },
  { n: "04", title: "Credential", body: "Mint a self-claimed on-chain score record. Issuer-attested credentials require a separate owner signature." },
];

function Landing({ onStart, onExplore }) {
  return (
    <div className="page landing">
      <section className="section-block hero">
        <div className="hero-copy">
          <Badge>Avalanche Fuji Testnet</Badge>
          <h1 className="display">
            Learn Avalanche.
            <br />
            Record what you learn.
          </h1>
          <p className="lede">
            Master Avalanche concepts through interactive challenges, earn points,
            complete learning paths, and mint a self-claimed on-chain score record.
          </p>
          <div className="hero-actions">
            <Button onClick={onStart}>Start learning</Button>
            <Button variant="secondary" onClick={onExplore}>Explore how it works</Button>
          </div>
        </div>
        <Card className="hero-diagram" aria-label="SkillForge progression">
          <p className="kicker">Product loop</p>
          <ol className="loop-list">
            {LOOP.map((item, i) => (
              <li key={item}>
                <span>{item}</span>
                {i < LOOP.length - 1 && <span className="loop-arrow" aria-hidden="true">↓</span>}
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="section-block trust-strip">
        <p className="kicker">Built for Avalanche</p>
        <ul>
          <li>Avalanche Fuji Testnet</li>
          <li>Wallet-based progression</li>
          <li>On-chain credentials</li>
          <li>Interactive learning</li>
        </ul>
      </section>

      <section id="how-it-works" className="section-block">
        <h2>How SkillForge works</h2>
        <div className="timeline">
          {HOW.map((step) => (
            <article className="timeline-item" key={step.n}>
              <span className="kicker">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2>Difficulty</h2>
        <div className="difficulty-grid">
          {DIFFICULTY_LEVELS.map((level) => (
            <Card key={level.id} className={`difficulty-card difficulty-card-${level.id}`}>
              <p className="kicker">{PATH_COPY[level.id].kicker}</p>
              <h3>{PATH_COPY[level.id].title}</h3>
              <p>{level.description}</p>
              <p className="meta-line">{level.questionsPerQuiz} questions · {level.pointsPerQuestion} pts each</p>
              <Button onClick={onStart}>Start</Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-block split">
        <div>
          <h2>Game progression</h2>
          <p>
            {PUZZLE_EXPLAINER.body} Unlocked pieces use the Avalanche accent.
            Locked pieces stay neutral.
          </p>
          <ol className="loop-list compact">
            {["Quiz", "Points", "Jigsaw pieces", "16-piece forge", "Certificate"].map((item, i) => (
              <li key={item}>
                <span>{item}</span>
                {i < 4 && <span className="loop-arrow" aria-hidden="true">↓</span>}
              </li>
            ))}
          </ol>
        </div>
        <div className="preview-grid" aria-hidden="true">
          {Array.from({ length: TOTAL_PIECES }, (_, i) => (
            <div key={i} className={`preview-cell ${i % 3 === 0 ? "on" : ""}`} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2>Credentials</h2>
        <div className="credential-paths">
          <Card className="credential-path-claimed">
            <CredentialStatusBadge status={CREDENTIAL_STATES.claimed} />
            <h3>{CREDENTIAL_STATES.claimed.title}</h3>
            <ol className="loop-list compact">
              <li>User completes quiz</li>
              <li>User claims score</li>
              <li>On-chain self-claimed record</li>
            </ol>
            <p className="note">{CREDENTIAL_STATES.claimed.body}</p>
          </Card>
          <Card className="credential-path-attested">
            <CredentialStatusBadge status={CREDENTIAL_STATES.attested} />
            <h3>{CREDENTIAL_STATES.attested.title}</h3>
            <ol className="loop-list compact">
              <li>Learning result</li>
              <li>Issuer review</li>
              <li>EIP-712 authorization</li>
              <li>On-chain issuer-attested credential</li>
            </ol>
            <p className="note">{CREDENTIAL_STATES.attested.body}</p>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default Landing;
