export const LEGAL_PAGES = Object.freeze({
  privacy: {
    id: "privacy",
    path: "/privacy",
    title: "Privacy Policy",
    updated: "25 August 2026",
    sections: [
      {
        heading: "What we collect",
        body: "SkillForge uses an account (email or Google) so your learning progress can follow you. We store the display name you choose, quiz and puzzle progress, and append-only learning events used to derive XP. If you connect a wallet, we store that address to link a mint. We do not ask for a password to your wallet.",
      },
      {
        heading: "Leaderboard",
        body: "New learners appear on the live board under their display name. Standing is derived from learning events. You can hide yourself on the Board page at any time. Hiding removes your name from the public ranking.",
      },
      {
        heading: "What is public",
        body: "If you mint a credential on Avalanche Fuji, that on-chain record is public (holder, score, and related fields). Lookup shows an on-chain record, not a verified exam. Leaderboard names are visible to signed-in learners unless you hide.",
      },
      {
        heading: "What we do not do",
        body: "We do not sell your account data. We do not treat a claimed score as an issuer-attested credential. Fuji is a test network.",
      },
    ],
  },
  terms: {
    id: "terms",
    path: "/terms",
    title: "Terms of Service",
    updated: "25 August 2026",
    sections: [
      {
        heading: "The product",
        body: "SkillForge is an Avalanche learning product. You can study, take quizzes, earn points and XP, assemble a certificate puzzle, and optionally record a soulbound credential on Avalanche Fuji.",
      },
      {
        heading: "Accounts and wallets",
        body: "An account is required to keep progress. A wallet is optional until you mint. You are responsible for your account, your wallet approvals, and any test AVAX you use on Fuji.",
      },
      {
        heading: "Scores and credentials",
        body: "Quiz points, XP, and leaderboard standing are learning records. A self-minted credential is a claimed score, not an independently verified exam. Issuer-attested credentials are a separate, privileged path.",
      },
      {
        heading: "Acceptable use",
        body: "Do not disrupt the service, impersonate others, or treat SkillForge as financial, legal, or professional advice. Fuji testnet assets have no production value.",
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
