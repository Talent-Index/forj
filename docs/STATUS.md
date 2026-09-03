# Forjora — Status

Last updated: 3 September 2026

This is the shipped product today, against the [roadmap](./ROADMAP.md).

## Snapshot

| Area | Status |
| --- | --- |
| Foundation (wallet, quiz, scoring, puzzle, CI) | Complete |
| Identity | Account sign-in (email or Google) with progress on the learner account |
| Learning experience | Partial — onboarding, explanations, dashboard, and structured tracks shipped |
| Credentials | Partial — soulbound contract live on Fuji; learner mint is self-claimed |
| Gamification | Live opt-in community ranking from a learner-published event log (not a trusted ledger); XP, levels, achievements, streaks, path engine |
| Platform | Partial — account-backed progress and wallet linking; issuer ops not shipped |
| Security & Launch | Partial — production readiness gate is **closed**; launch validation **not approved** for public launch |
| Fuji credential | Live |

Fuji contract: [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df) (chain ID 43113).

## Identity

The learner-facing mark is **Forjora**: a geometric “F” / upward pathway icon in charcoal with a gold accent step, plus a bold FORJORA wordmark. Brand feeling: Learn → Build → Prove → Advance.

Learners use an **account** (email/password or Google). Name, email, and password create the account; a verification link must be opened before the learner is treated as signed in for progress. Progress follows that account across browsers and devices. **Email verification is required** before account-backed Firestore and Storage access. Repeated sign-in, signup, and password-reset attempts are throttled in the app, in addition to Firebase Auth quotas. A **wallet** is optional until the learner mints and is not a signup gate. Connecting a wallet auto-links it to the signed-in account. If that wallet has local quiz or puzzle progress in this browser, that snapshot replaces the account copy. An empty wallet does not wipe the account. A wallet already linked to another account is not adopted. Switching wallets does not move another person’s XP or puzzle. Signing out does not leave progress on the next session’s account.

Privacy Policy and Terms of Service are linked from signup and the footer.

Existing browser progress is moved onto the account once, so a returning learner does not start from zero.

## Learning

- Easy, Medium, and Hard quizzes: five unique questions per attempt, with hints and explanations after submit.
- Retry-safe **points**: a later attempt on the same difficulty replaces that section’s score.
- Structured **path** with six tracks: Fundamentals, Architecture, L1s, C-Chain & Smart Contracts, ICM, Developer.
- Lessons unlock in order. Quizzes sit on the path (Easy → Fundamentals, Medium → Architecture, Hard → Developer capstone).

## Progression

- One event stream drives XP, levels, achievements, streaks, path completion, puzzle events, and credentials.
- Quiz retries do not farm XP.
- Streaks use UTC calendar days. Duplicate activity on the same UTC day does not inflate the streak.
- Achievements unlock from events (first quiz, perfect score, difficulties, streak, puzzle, credential, track, path).
- Dashboard shows level, XP, streak, puzzle count, path progress, and the next recommended activity.

## Puzzle and certificate

- Sixteen interlocking jigsaw pieces. Points buy a piece; the same piece cannot be bought twice.
- Completing the puzzle reveals the certificate, asks for a recipient name, then continues to the credential flow.
- Artwork: Forjora forge certificate image — blacksmith in a workshop presenting a crafted diamond; banners say Forjora and Learn · Forge · Prove, not “certified” or “verified”.

## Credentials

- Soulbound NFT. It cannot be transferred.
- Learner mint records a **claimed** score.
- The contract also supports **issuer-attested** mint with an owner signature. That path is not the default learner UI.
- Shareable lookup by credential ID or holder wallet (URL and QR). Lookup is not listed in the primary navigation. A found record is an on-chain record, not a verified exam.
- Forjora does not issue credentials on Avalanche C-Chain today.

## Leaderboard

New verified accounts appear on the live board under their display name, including at 0 XP. They can hide. Standing is derived from an append-only log of first-time learning events that learners publish under rules (lesson ids are allowlisted). Learners cannot write XP totals or rank fields. Quiz retries do not farm standing. The board is **community ranking**, not a tamper-proof exam.

It is not a league with an issuer, not on-chain, and not a verified exam. A claimed credential remains distinct from this board.

## Not shipped yet

- Server-written XP ledgers (the live board replays the event log; clients still cannot write XP)
- Question bank managed independently of the app
- Learning analytics dashboards
- Public learner profile pages (for example `/dave`) and a Forjora Issuer dashboard
- Credential revocation and versioning
- Independent review of freeze v1, issuer operations, production monitoring, and Avalanche C-Chain issuance (the production readiness gate stays closed; launch validation is not public-launch approval; see [Security & Launch](./ROADMAP.md))
