# SkillForge

SkillForge is an Avalanche learning product. Learners study network concepts, complete challenges, earn progress, assemble a certificate puzzle, and can record a soulbound on-chain credential on Avalanche Fuji.

Learning does not require a wallet. A wallet is needed only to mint or look up an on-chain record.

## The loop

**Learn → Challenge → Earn → Unlock → Forge → Prove**

1. Follow a structured Avalanche path (tracks, lessons, and quizzes).
2. Complete Easy, Medium, and Hard challenges. Retries replace a section’s score; they do not stack extra points.
3. Earn points, XP, levels, achievements, and a UTC learning streak.
4. Spend points to seat interlocking pieces of a 4×4 certificate jigsaw.
5. When the puzzle is complete, reveal a personalized certificate (blacksmith, forge, and crafted diamond).
6. Optionally mint a soulbound credential. Anyone can look up that public Fuji record.

## What learners get

- An **account** (email or Google) that holds progress across devices. A wallet is optional until mint.
- **Six Avalanche tracks:** Fundamentals, Architecture, L1s, C-Chain & Smart Contracts, ICM, and Developer.
- **XP and levels** from real completions, not quiz retries.
- **Achievements** and **streaks** from the same learning events.
- A **true interlocking puzzle**, not square tiles pretending to be pieces.
- An opt-in **live leaderboard**. Standing is derived from an append-only event log. It is not issuer-attested and not on-chain.

## Credentials, honestly

There are two kinds of on-chain record:

| Record | Meaning |
| --- | --- |
| **Claimed** | The learner published their own scores. |
| **Issuer-attested** | The contract owner authorized that record with a signature. |

A claimed score is not an independently verified assessment. Public lookup shows that a record exists on Fuji. Lookup is not issuer attestation. Explorer links show on-chain presence, not certification.

The live Fuji credential contract is [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df).

## Product docs

| Doc | What it covers |
| --- | --- |
| [Status](docs/STATUS.md) | What is shipped today |
| [Roadmap](docs/ROADMAP.md) | Phases from foundation through ecosystem |
| [Progression](docs/PROGRESSION.md) | Paths, XP, achievements, streaks, puzzle, leaderboard |
| [Credential](docs/CREDENTIAL.md) | On-chain learning record and claimed vs attested |
| [Authorization](docs/AUTHORIZATION.md) | How issuer attestation is designed |
| [Metadata](docs/METADATA.md) | What the certificate record displays |
