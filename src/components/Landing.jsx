import WalletConnect from "./WalletConnect";
import ProductIntro from "./ProductIntro";
import {
  WALLET_GUIDANCE,
  FUJI_EXPLAINER,
} from "../utils/onboarding";

function Landing({ wallet }) {

  return (
    <div className="landing">
      <ProductIntro />

      <section className="landing-cta-section" id="connect-wallet">
        <h2 className="landing-section-title">{WALLET_GUIDANCE.title}</h2>
        <p className="landing-subtitle wallet-guidance-lead">{WALLET_GUIDANCE.body}</p>
        <ol className="wallet-guidance-list">
          {WALLET_GUIDANCE.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="landing-subtitle">
          {FUJI_EXPLAINER.body}{" "}
          <a href={FUJI_EXPLAINER.faucetUrl} target="_blank" rel="noreferrer">
            Fuji faucet
          </a>
        </p>
        <div className="landing-cta">
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
            guidance
          />
        </div>
      </section>

      <footer className="landing-footer">
        <span>SkillForge</span>
        <span className="footer-sep">·</span>
        <span>Read the loop first, then connect on Avalanche Fuji</span>
      </footer>
    </div>
  );
}

export default Landing;
