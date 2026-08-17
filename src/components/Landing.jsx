import WalletConnect from "./WalletConnect";

const FEATURES = [
  {
    icon: "📚",
    title: "Learn Avalanche",
    desc: "Master consensus, subnets, staking, ICM, and L1 design through bite-sized quizzes.",
  },
  {
    icon: "🧩",
    title: "Solve the Puzzle",
    desc: "Earn points, redeem puzzle pieces, and build a certificate that reflects your progress.",
  },
  {
    icon: "⛓️",
    title: "Mint On Fuji",
    desc: "Record claimed scores as a soulbound credential on Avalanche Fuji with an explorer link.",
  },
];

function Landing({ wallet }) {
  return (
    <div className="landing">
      <section className="landing-hero landing-hero-focus">
        <div className="landing-badge">Avalanche Fuji · Testnet</div>
        <h1 className="landing-title">SkillForge</h1>
        <p className="landing-tagline">
          Learn <span>Avalanche</span>. Mint a credential.
        </p>
        <p className="landing-subtitle">
          A focused learning quest: quiz across difficulty tiers, unlock puzzle pieces,
          then mint an on-chain record of your claimed scores on Fuji.
        </p>
        <div className="landing-cta landing-cta-hero">
          <WalletConnect
            address={wallet.address}
            connecting={wallet.connecting}
            switching={wallet.switching}
            error={wallet.error}
            chainId={wallet.chainId}
            isFuji={wallet.isFuji}
            walletName={wallet.walletName}
            available={wallet.available}
            isMobile={wallet.isMobile}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
            onSwitch={() => wallet.switchToFuji().catch(() => {})}
          />
        </div>
      </section>

      <section className="landing-features">
        <h2 className="landing-section-title">What you get</h2>
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

      <footer className="landing-footer">
        <span>SkillForge</span>
        <span className="footer-sep">·</span>
        <span>On-chain claimed-score credentials on Avalanche Fuji</span>
      </footer>
    </div>
  );
}

export default Landing;
