import WalletConnect from "./WalletConnect";

const FEATURES = [
  {
    icon: "📚",
    title: "Learn Avalanche",
    desc: "Master consensus, subnets, staking & the X/P/C chains through bite-sized quizzes across three difficulty tiers.",
  },
  {
    icon: "🧩",
    title: "Solve the Puzzle",
    desc: "Every correct answer earns points. Spend them to reveal pieces of the Avalanche artwork and track your mastery.",
  },
  {
    icon: "⛓️",
    title: "Mint a Credential",
    desc: "Finish the quest and mint a verifiable on-chain credential to the Avalanche Fuji testnet — yours forever.",
  },
];

const STEPS = [
  { num: "01", title: "Connect Wallet", desc: "Link MetaMask or Core Wallet on Avalanche Fuji." },
  { num: "02", title: "Master the Quiz", desc: "Answer Easy, Medium & Hard questions to earn points." },
  { num: "03", title: "Mint On-Chain", desc: "Complete the puzzle and mint your verifiable credential." },
];

function Landing({ wallet }) {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-badge">🏔️ Avalanche Fuji · Testnet</div>
        <h1 className="landing-title">SkillForge</h1>
        <p className="landing-tagline">
          Learn <span>Avalanche</span>. Earn <span>Credentials</span>.
        </p>
        <p className="landing-subtitle">
          A gamified learning quest that turns Avalanche knowledge into a
          verifiable, on-chain credential. Quiz your way through consensus,
          subnets and staking — then mint your proof of mastery.
        </p>
      </section>

      <section className="landing-features">
        <h2 className="landing-section-title">Why SkillForge</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-how">
        <h2 className="landing-section-title">How it works</h2>
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <div className="step-card" key={s.num}>
              <span className="step-num">{s.num}</span>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
              {i < STEPS.length - 1 && <span className="step-arrow" aria-hidden>→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta-section">
        <h2 className="landing-section-title">Ready to begin?</h2>
        <div className="landing-cta">
          <WalletConnect
            address={wallet.address}
            connecting={wallet.connecting}
            error={wallet.error}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
        </div>
      </section>

      <footer className="landing-footer">
        <span>🏔️ SkillForge</span>
        <span className="footer-sep">·</span>
        <span>Verifiable on-chain credentials on Avalanche Fuji</span>
      </footer>
    </div>
  );
}

export default Landing;
