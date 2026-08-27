# SkillForge — Status

Last updated: 27 August 2026

This is the shipped product today, against the [roadmap](./ROADMAP.md).

## Snapshot

| Area | Status |
| --- | --- |
| Foundation (wallet, quiz, scoring, puzzle, CI) | Complete |
| Identity | Account sign-in (email or Google) with progress on the learner account |
| Learning experience | Partial — onboarding, explanations, dashboard, and structured tracks shipped |
| Credentials | Partial — soulbound contract live on Fuji; learner mint is self-claimed |
| Gamification | Live opt-in ranking from an append-only event log; XP, levels, achievements, streaks, path engine |
| Platform | Partial — account-backed progress and wallet linking; issuer ops not shipped |
| Security & Launch | Planned — Fuji contract tests shipped; independent audit and mainnet issuance not shipped |
| Fuji credential | Live |

Fuji contract: [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df) (chain ID 43113).

## Identity

Learners use an **account** (email or Google). The preferred name is collected once at signup. Progress follows that account across browsers and devices. A **wallet** is optional until the learner mints and is not a signup gate. Switching wallets does not move another person’s XP or puzzle. Signing out does not leave progress on the next session’s account.

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
- Artwork concept: a refined blacksmith in a forge holding a crafted diamond (learning, learner, skill).

## Credentials

- Soulbound NFT. It cannot be transferred.
- Learner mint records a **claimed** score.
- The contract also supports **issuer-attested** mint with an owner signature. That path is not the default learner UI.
- Public lookup by credential ID or holder wallet, signed in or out. A found record is an on-chain record, not a verified exam.

## Leaderboard

New learners appear on the live board under their display name. They can hide. Standing is derived from an append-only log of first-time learning events. Learners cannot write XP or rank. Quiz retries do not farm standing.

It is not a league with an issuer, not on-chain, and not a verified exam. A claimed credential remains distinct from this board.

## Not shipped yet

- Server-written XP ledgers (the live board replays the event log; clients still cannot write XP)
- Question bank managed independently of the app
- Learning analytics dashboards
- Issuer model, dashboard, and key management
- Credential revocation and versioning
- Independent audit, production monitoring, and mainnet issuance (see [Security & Launch](./ROADMAP.md))
