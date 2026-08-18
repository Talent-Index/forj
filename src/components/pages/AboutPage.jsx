import { Card } from "../ui/primitives";
import {
  CREDENTIAL_EXPLAINER,
  FUJI_EXPLAINER,
  INTRODUCTION,
  WALLET_GUIDANCE,
} from "../../utils/onboarding";

function AboutPage() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">About</p>
        <h1>Learn SkillForge</h1>
        <p className="lede">{INTRODUCTION.body}</p>
      </header>

      <section className="section-block">
        <h2>Why Avalanche</h2>
        <p>
          SkillForge is built for people learning Avalanche: consensus, C-Chain, L1s, and ICM.
          Credentials are recorded on Avalanche Fuji so the learning record lives on the same ecosystem you are studying.
        </p>
      </section>

      <section className="section-block split">
        <Card>
          <h3>Claimed credential</h3>
          <p>{CREDENTIAL_EXPLAINER.claimed}</p>
          <p className="note">User-claimed learning record. Not an independently verified examination.</p>
        </Card>
        <Card>
          <h3>Issuer-attested credential</h3>
          <p>{CREDENTIAL_EXPLAINER.attested}</p>
          <p className="note">Higher-trust path. Requires an owner EIP-712 signature.</p>
        </Card>
      </section>

      <section className="section-block">
        <h2>{FUJI_EXPLAINER.title}</h2>
        <p>{FUJI_EXPLAINER.body}</p>
        <p>
          <a href={FUJI_EXPLAINER.faucetUrl} target="_blank" rel="noreferrer">Get Fuji test AVAX</a>
          {" — "}
          {FUJI_EXPLAINER.faucetHint}
        </p>
      </section>

      <section className="section-block">
        <h2>Credential integrity</h2>
        <p>{CREDENTIAL_EXPLAINER.body}</p>
        <p>{WALLET_GUIDANCE.body}</p>
      </section>
    </div>
  );
}

export default AboutPage;
