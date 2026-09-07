# Forjora — Status

Last updated: 7 September 2026

This is the shipped product today, against the [roadmap](./ROADMAP.md).

## Snapshot

| Area | Status |
| --- | --- |
| Foundation (wallet, quiz, scoring, puzzle, CI) | Complete |
| Identity | Account sign-in (email or Google) with progress on the learner account |
| Learning experience | Partial — Learn hub with track discovery, vertical track journeys, lesson workspace; six Avalanche tracks; content beyond these tracks not shipped |
| Credentials | Partial — soulbound contract live on Fuji; learner mint is self-claimed |
| Gamification | Live community ranking of verified accounts from a learner-published event log (not a trusted ledger); XP, levels, achievements, streaks, path engine |
| Platform | Partial — account-backed progress and wallet linking; issuer ops not shipped |
| Security & Launch | Partial — production readiness gate is **closed**; launch validation **not approved** for public launch |
| Fuji credential | Live |

Fuji contract: [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df) (chain ID 43113).

## Identity

The learner-facing mark is **Forjora**: a geometric “F” / upward pathway icon in charcoal with a forge-orange accent step, plus a bold FORJORA wordmark. Brand feeling: Learn → Build → Prove → Advance. The product UI is a digital sketchbook inside a modern forge — clean surfaces with hand-drawn doodle accents (not cartoon chrome). Signature motion language: **draw** (sketched into view), **forge** (hammer → diamond), and **verify** (nodes connect → check), with reduced-motion support.

Learners use an **account** (email/password or Google). Name, email, and password create the account; a verification link must be opened before the learner is treated as signed in for progress. Progress follows that account across browsers and devices. **Email verification is required** before account-backed Firestore and Storage access. Repeated sign-in, signup, and password-reset attempts are throttled in the app, in addition to Firebase Auth quotas. A **wallet** is optional until the learner mints and is not a signup gate. Connecting a wallet auto-links it to the signed-in account. If that wallet has local quiz or puzzle progress in this browser, that snapshot replaces the account copy. An empty wallet does not wipe the account. A wallet already linked to another account is not adopted. Switching wallets does not move another person’s XP or puzzle. Signing out does not leave progress on the next session’s account.

Privacy Policy and Terms of Service are linked from signup and the footer.

Existing browser progress is moved onto the account once, so a returning learner does not start from zero.

## Learning

- **Learn on Forjora** hub: continue learning, category filters, track cards (modules · lessons · challenges · skills · progress), and knowledge-check challenges.
- Track pages use a vertical **learning path** (completed / current / locked) ending in a credential milestone.
- Lesson workspace: track nav · lesson body · progress/skills rail (stacks on mobile).
- Easy, Medium, Hard, and Master quizzes are Foundation / Builder / Advanced / Mastery assessments (5 / 7 / 10 / 12 questions). Knowledge checks appear after a short stretch of learning, not on a fixed lesson count.
- Quizzes award XP and puzzle fragments on first completion (retries do not farm rewards). Five fragments convert into one puzzle piece. Fuji seating/mint still uses the frozen Easy / Medium / Hard five-correct scale (80 points).
- Structured path with six tracks: Fundamentals, Architecture, L1s, C-Chain & Smart Contracts, ICM, Developer.
- Lessons unlock in order. Each lesson has a deeper body and an official Avalanche reference. Quizzes sit on the path (Easy → Fundamentals, Medium → Architecture, Hard → Developer capstone; Mastery is assessment-only).

## Progression

- One event stream drives XP, levels, achievements, streaks, path completion, puzzle events, and credentials.
- Quiz retries do not farm XP or puzzle fragments.
- Mastery (accuracy by difficulty) sits beside XP (activity). Puzzle progress shows pieces seated and fragments toward the next piece.
- Streaks use UTC calendar days. Duplicate activity on the same UTC day does not inflate the streak.
- Achievements unlock from events (first quiz, perfect score, difficulties, streak milestones, puzzle milestones, skill ladders, credential, track certificates, path). The Progress forge shows family-grouped badges, streak calendar, puzzle milestones, and off-chain learning certificates — distinct from Fuji claimed or issuer-attested mints.
- Dashboard shows level, XP, streak, puzzle count, path progress, and the next recommended activity.

## Puzzle and certificate

- Sixteen interlocking pieces, reserved by quiz: Easy 3, Medium 5, Hard 8. Points from a quiz only seat that quiz’s pieces. Puzzle fragments from assessments convert into additional pieces (5 fragments = 1 piece).
- Each of the six tracks has a certificate. Quiz tracks are achieved when their pieces are seated. Lesson tracks (L1s, C-Chain, ICM) are achieved when the track is complete.
- Credentials separates **track certificates** (off-chain learning records, in progress or achieved) from the **path snapshot** (sixteen pieces → name → optional claimed Fuji mint). Achieved track cards do not pretend to be on-chain tokens.
- Artwork: Forjora forge certificate image — blacksmith in a workshop presenting a crafted diamond; banners say Forjora and Learn · Forge · Prove, not “certified” or “verified”.

## Credentials

- Soulbound NFT. It cannot be transferred.
- Learner mint records a **claimed** score.
- The Credentials page shows the full evidence stack: journey steps, credential puzzle + fragments, skills demonstrated, Foundation→Master learning certificates, track certificates, then the optional claimed Fuji path snapshot.
- The contract also supports **issuer-attested** mint with an owner signature. That path is not the default learner UI.
- Shareable lookup by credential ID or holder wallet (URL and QR). Sharing the site or a credential URL shows Forjora forge artwork in the link preview. Lookup is not listed in the primary navigation. A found record is an on-chain record, not a verified exam.
- Forjora does not issue credentials on Avalanche C-Chain today.

## Leaderboard

New verified accounts appear on the live board under their display name, including at 0 XP and including people who signed up before opening Board. They can hide. Standing is derived from an append-only log of first-time learning events that learners publish under rules (lesson ids are allowlisted). Learners cannot write XP totals or rank fields. Quiz retries do not farm standing. The board is **community ranking**, not a tamper-proof exam.

It is not a league with an issuer, not on-chain, and not a verified exam. A claimed credential remains distinct from this board.

## Not shipped yet

- Server-written XP ledgers (the live board replays the event log; clients still cannot write XP)
- Question bank managed independently of the app
- Learning analytics dashboards
- Public learner profile pages (for example `/dave`) and a Forjora Issuer dashboard
- Credential revocation and versioning
- Independent review of freeze v1, issuer operations, production monitoring, and Avalanche C-Chain issuance (the production readiness gate stays closed; launch validation is not public-launch approval; see [Security & Launch](./ROADMAP.md))
