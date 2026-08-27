export const LEGAL_PAGES = Object.freeze({
  privacy: {
    id: "privacy",
    path: "/privacy",
    title: "Privacy Policy",
    updated: "28 August 2026",
    sections: [
      {
        heading: "What we collect",
        body: "SkillForge uses an account (email or Google) so your learning progress can follow you. We store the display name you choose, quiz and puzzle progress, and append-only learning events used to derive XP. If you connect a wallet, we store that address to link a mint. We do not ask for a password to your wallet. Issuer signing keys are not stored in the learner app.",
      },
      {
        heading: "Leaderboard",
        body: "New learners appear on the live board under their display name. Standing is derived from learning events. You can hide yourself on the Board page at any time. Hiding removes your name from the public ranking. Rank is not issuer-attested and not on-chain.",
      },
      {
        heading: "What is public",
        body: "If you mint a credential on Avalanche Fuji, that on-chain record is public (holder, score, and related fields). Lookup shows an on-chain record, not a verified exam. Leaderboard names are visible to signed-in learners unless you hide.",
      },
      {
        heading: "What we do not do",
        body: "We do not sell your account data. We do not treat a claimed score as an issuer-attested credential. SkillForge issues credentials on Avalanche Fuji, a test network. We do not issue SkillForge credentials on Avalanche C-Chain today.",
      },
    ],
  },
  terms: {
    id: "terms",
    path: "/terms",
    title: "Terms of Service",
    updated: "28 August 2026",
    sections: [
      {
        heading: "The product",
        body: "SkillForge is an Avalanche learning product. You can study, take quizzes, earn points and XP, assemble a certificate puzzle, and optionally record a soulbound credential on Avalanche Fuji. SkillForge does not currently offer credential issuance on Avalanche C-Chain.",
      },
      {
        heading: "Accounts and wallets",
        body: "An account is required to keep progress. A wallet is optional until you mint. You are responsible for your account, your wallet approvals, and any test AVAX you use on Fuji. Fuji test assets have no production market value.",
      },
      {
        heading: "Scores and credentials",
        body: "Quiz points, XP, and leaderboard standing are learning records, not an exam. A self-minted credential is a claimed score, not independently verified, certified, or accredited. Issuer-attested credentials are a separate, privileged path. A claimed record does not become attested later in place.",
      },
      {
        heading: "If something goes wrong",
        body: "This credential version has no pause switch. Already-minted tokens stay claimed or attested as minted. If an issuer key is compromised, new attested signatures from that key should stop after a two-step owner handoff. Claimed mint is a public function; it cannot be switched off on-chain.",
      },
      {
        heading: "Acceptable use",
        body: "Do not disrupt the service, impersonate others, or treat SkillForge as financial, legal, or professional advice. Do not present a claimed Fuji record as an Avalanche certification or a mainnet credential.",
      },
    ],
  },
});

export function legalPageFromPath(pathname = "") {
  const path = String(pathname || "/").replace(/\/+$/, "") || "/";
  if (path === "/privacy") return "privacy";
  if (path === "/terms") return "terms";
  return null;
}
