# Forjora — System flow

How the product moves a learner from account to proof — what ships today, and what can be added without blurring claimed learning with issuer attestation.

Related: [Status](./STATUS.md) · [Roadmap](./ROADMAP.md) · [Progression](./PROGRESSION.md) · [Credential](./CREDENTIAL.md)

---

## 1. Product loop (shipped)

```mermaid
flowchart LR
  Learn[Learn] --> Challenge[Challenge]
  Challenge --> Earn[Earn XP / points]
  Earn --> Unlock[Unlock path / pieces]
  Unlock --> Forge[Forge puzzle / certificates]
  Forge --> Prove[Prove — optional Fuji mint + Lookup]
```

| Stage | What happens today |
| --- | --- |
| Learn | Seven Avalanche tracks, ordered lessons, self-claimed project lab on Developer |
| Challenge | Easy / Medium / Hard seating quizzes; Mastery deepens knowledge without changing Fuji seating |
| Earn | First-time XP, puzzle fragments, points; retries do not farm rewards |
| Unlock | Track and module gates; seating points unlock that quiz’s reserved pieces |
| Forge | Sixteen-piece puzzle, track certificates (off-chain), path snapshot |
| Prove | Optional claimed soulbound mint on Fuji; public Lookup / share URL / QR |

---

## 2. Identity and access (shipped)

```mermaid
flowchart TD
  Guest[Guest] --> Browse[Browse Learn landing / Board / Lookup]
  Guest --> SignIn[Account sign-in]
  SignIn --> Verify[Email verified]
  Verify --> Progress[Account-backed progress]
  Progress --> LearnPath[Learn path]
  Progress --> OptionalWallet[Optional wallet link]
  OptionalWallet --> MintGate[Wallet required only to mint]
  MintGate --> FujiMint[Claimed Fuji mint]
```

- An **account** holds progress. A **wallet** is not a signup gate.
- Linking a wallet can adopt that browser’s quiz/puzzle snapshot onto the account; it does not become the account.
- Board standing and XP are not issuer-attested and not on-chain.

---

## 3. Learning path (shipped)

```mermaid
flowchart TD
  F[Fundamentals + Easy] --> A[Architecture + Medium]
  A --> L[L1s — lesson-only]
  A --> C[C-Chain — lesson-only]
  L --> I[ICM — lesson-only]
  C --> I
  I --> D[Developer]
  D --> DL[Tooling lessons]
  DL --> DP[Project lab — self-claimed]
  DP --> DQ[Hard seating]
  DQ --> S[Security Practices — lesson-only]
```

| Kind | Tracks | Seating effect |
| --- | --- | --- |
| Quiz tracks | Fundamentals, Architecture, Developer | Easy 3 / Medium 5 / Hard 8 pieces |
| Lesson tracks | L1s, C-Chain, ICM, Security | Track certificate when complete; no seating quiz |
| Project lab | Developer module before Hard | Self-claimed lessons only — not graded, not issuer-attested |

Puzzle seats **0–15** stay frozen. There is no fourth seating quiz.

---

## 4. Progress → certificates → on-chain (shipped)

```mermaid
flowchart TD
  Events[Learning events] --> XP[XP · levels · achievements · streaks]
  Events --> Frag[Puzzle fragments]
  Events --> Points[Quiz points by section]
  Frag --> Piece[5 fragments → 1 piece]
  Points --> Seat[Seat Easy / Medium / Hard pieces]
  Seat --> PathCert[Path certificate when 16 seated]
  Events --> TrackCert[Track certificates — off-chain]
  PathCert --> Name[Name the path credential]
  Name --> Claimed[Optional Forjora claimed mint on Fuji]
  Claimed --> Lookup[Public Lookup / share / QR]
```

Honesty:

| Record | Meaning |
| --- | --- |
| Track / learning certificate | Off-chain path progress |
| Project lab complete | Self-claimed learning activity |
| Forjora claimed mint | Learner published their own score snapshot on Fuji |
| Forjora issuer-attested | Contract owner authorized the record — **not** the default learner mint |

Looking up a Fuji record proves presence on-chain. It does not turn a claimed score into an issuer assessment.

---

## 5. Surfaces a learner meets (shipped)

```mermaid
flowchart LR
  Hub[Learn hub] --> Journey[Track journey]
  Journey --> Lesson[Lesson workspace]
  Journey --> Quiz[Challenge]
  Hub --> Progress[Progress forge]
  Hub --> Creds[Credential vault]
  Creds --> Puzzle[Puzzle board]
  Creds --> Mint[Optional mint]
  Board[Board / public profile] --> Rank[Community ranking]
  Lookup[Lookup] --> Record[On-chain record view]
```

---

## 6. What can be added (planned)

Extensions that fit the same honesty model — claimed learning stays distinct from attestation.

```mermaid
flowchart TD
  Today[Shipped Fuji loop] --> LearnMore[More lesson tracks / banks]
  Today --> Labs[Richer project / capstone labs]
  Today --> IssuerUI[Attested mint in learner UI]
  Today --> IssuerOps[Issuer keys · dashboard · revocation]
  Today --> Analytics[Learning analytics · question ops]
  Today --> Mainnet[C-Chain issuance after production gate]
  Today --> Eco[Partners · collections · third-party verify]

  LearnMore -.-> Honesty[Still learning records unless issuer-attested]
  Labs -.-> Honesty
  IssuerUI --> Attest[Privileged attestation path]
  IssuerOps --> Attest
  Mainnet --> Attest
  Eco --> Attest
```

| Addition | Role | Must not imply |
| --- | --- | --- |
| More path content / labs | Deeper learning and self-claimed practice | Foundation exam or graded review |
| Issuer dashboard + attested mint UI | Privileged attestation | That claimed scores were always attested |
| Revocation / versioning | Credential lifecycle | That Lookup alone is certification |
| C-Chain issuance | Production network after gate opens | That Fuji claimed equals Mainnet diploma |
| Partners / ecosystem | External verification of **attested** records | That Board rank or claimed mint is partner-attested |

Production readiness (independent review, issuer custody, monitoring, C-Chain deploy) stays on the Security & Launch gate — see [Roadmap](./ROADMAP.md).

---

## 7. One-page map

```text
                    ACCOUNT (progress)          WALLET (optional → mint)
                           │                              │
                           ▼                              │
          ┌──────── Learn path (7 tracks) ────────┐       │
          │  lessons → lab (claimed) → quizzes    │       │
          └───────────────┬───────────────────────┘       │
                          ▼                               │
              XP · badges · streak · Board                │
                          │                               │
                          ▼                               │
              Puzzle (16) · track certs (off-chain)       │
                          │                               │
                          ▼                               │
              Path credential named ──────────────────────┘
                          │
                          ▼
              Claimed Fuji mint → Lookup
                          │
                          ╳  (not default)
                          ▼
              Issuer-attested  ← planned ops / UI
```
