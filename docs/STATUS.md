# SkillForge — Status

Last updated: 25 August 2026

This is the shipped product today, against the [roadmap](./ROADMAP.md).

## Snapshot

| Area | Status |
| --- | --- |
| Foundation (wallet, quiz, scoring, puzzle, CI) | Complete |
| Identity | Account sign-in (email or Google) with progress on the learner account |
| Learning experience | Partial — onboarding, explanations, dashboard, and structured tracks shipped |
| Credentials | Partial — soulbound contract live on Fuji; learner mint is self-claimed |
| Gamification | Client preview — XP, levels, achievements, streaks, path engine, local leaderboard |
| Persistent learner backend | Partial — account-backed progress and wallet linking; issuer ops not shipped |
| Fuji credential | Live |

Fuji contract: [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df) (chain ID 43113).

## Identity

Learners use an **account** (email or Google). Progress follows that account across browsers and devices. A **wallet** is optional until the learner mints. Switching wallets does not move another person’s XP or puzzle. Signing out does not leave progress on the next session’s account.

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
- Artwork concept: a refined blacksmith in a forge holding a crafted diamond (learning, learner, skill).

## Credentials

- Soulbound NFT. It cannot be transferred.
- Learner mint records a **claimed** score.
- The contract also supports **issuer-attested** mint with an owner signature. That path is not the default learner UI.
- Public lookup by credential ID or holder wallet. A found record is an on-chain record, not a verified exam.

## Leaderboard

Opt-in ranking on this device only. Rank uses XP, then path completion, then achievement count, then earlier achievement time. It is not a competitive authority, not on-chain, and not a verified score.

## Not shipped yet

- Server-computed competitive rankings
- Question bank managed independently of the app
- Learning analytics dashboards
- Production monitoring and alerts
- Issuer model, dashboard, and key management
- Credential revocation and versioning
- Independent audit and mainnet issuance
