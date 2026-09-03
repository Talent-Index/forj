# Forjora

Forjora is an Avalanche learning product. Learners study network concepts, complete challenges, earn progress, assemble a certificate puzzle, and can record a soulbound on-chain credential on Avalanche Fuji.

Learning does not require a wallet. A wallet is needed only to mint or look up an on-chain record.

The mark is a geometric **F / upward pathway** in charcoal with a gold accent step — skills, progress, and transformation without crypto clichés.

## The loop

**Learn → Build → Prove → Advance**

(Product path: Learn → Challenge → Earn → Unlock → Forge → Prove.)

1. Follow a structured Avalanche path (tracks, lessons, and quizzes).
2. Complete Easy, Medium, and Hard challenges. Retries replace a section’s score; they do not stack extra points.
3. Earn points, XP, levels, achievements, and a UTC learning streak.
4. Spend points to seat interlocking pieces of a 4×4 certificate jigsaw.
5. When the puzzle is complete, reveal a personalized certificate (blacksmith, forge, and crafted diamond).
6. Optionally mint a soulbound credential. A minted record has a shareable URL and QR.

## What learners get

- An **account** (email or Google) that holds progress across devices. A wallet is optional until mint. Linking copies that wallet’s local quiz and puzzle snapshot onto the account; the wallet snapshot wins if both exist.
- **Privacy Policy** and **Terms of Service** for the account and learning record.
- **Six Avalanche tracks:** Fundamentals, Architecture, L1s, C-Chain & Smart Contracts, ICM, and Developer.
- **XP and levels** from real completions, not quiz retries.
- **Achievements** and **streaks** from the same learning events.
- A **true interlocking puzzle**, not square tiles pretending to be pieces.
- An opt-in **live leaderboard**. New learners are included by default. Standing is derived from an append-only event log. It is not issuer-attested and not on-chain.

## Credentials, honestly

There are two kinds of on-chain record:

| Record | Meaning |
| --- | --- |
| **Forjora claimed** | The learner published their own scores. |
| **Forjora issuer-attested** | The contract owner authorized that record with a signature. |

A claimed score is not an independently verified assessment. A shareable URL or QR shows that a record exists on Fuji. Opening that link is not issuer attestation, and lookup is not listed in the primary navigation. Explorer links show on-chain presence, not certification.

The live Fuji credential sits on [`SkillForgeCredential`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df) at [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df). That on-chain name is the legacy contract identity. Forjora does not issue credentials on Avalanche C-Chain today.

## Product docs

| Doc | What it covers |
| --- | --- |
| [Status](docs/STATUS.md) | What is shipped today |
| [Roadmap](docs/ROADMAP.md) | Foundation through Security & Launch, then ecosystem |
| [Progression](docs/PROGRESSION.md) | Paths, XP, achievements, streaks, puzzle, leaderboard |
| [Credential](docs/CREDENTIAL.md) | On-chain learning record and claimed vs attested |
| [Authorization](docs/AUTHORIZATION.md) | How issuer attestation is designed |
| [Metadata](docs/METADATA.md) | What the certificate record displays |
