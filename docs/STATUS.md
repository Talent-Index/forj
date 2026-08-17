# SkillForge — Implementation Status

Last updated: August 2026 · Branch: `audit/smart-contract-correctness`

This document tracks what is **shipped today** versus what remains on the [product roadmap](./ROADMAP.md).

---

## Summary

| Area | Status | Notes |
| --- | --- | --- |
| **Phase 1 — Foundation** | **Complete** | Wallet, quiz, scoring, persistence, puzzle, contract fixes, CI |
| **Phase 2 — Learning UX** | **Partial** | Hints/fun facts, dashboards; no full onboarding or answer explanations |
| **Phase 3 — Credentials** | **Partial** | Dual mint paths on-chain; UI uses self-claim only |
| **Phases 4–10** | **Planned** | Gamification, backend, issuer dashboard, mainnet, ecosystem |

**Network:** Avalanche Fuji testnet (chain ID `43113`). Contract address lives in local `deployments/fuji.json` after `npm run deploy:fuji` and is copied into `.env` as `VITE_CREDENTIAL_CONTRACT`.

---

## Shipped features

### Wallet & network

- MetaMask and Core Wallet detection (`src/utils/wallet.js`)
- Fuji chain switch / add-network flow
- Wrong-network gate blocks quiz, puzzle, and mint until on Fuji (`NetworkGate.jsx`)
- Session restore via `eth_accounts`; account and chain change listeners
- Mobile deep links for wallet apps
- Smoke test: `npm run test:wallet`

### Quiz system

- Exactly **5 unique random questions** per Easy / Medium / Hard session (`src/utils/quiz.js`)
- Question banks: **8 questions per tier** (`src/data/questions.js`) — enough for randomization
- Fisher–Yates shuffle with injectable RNG (deterministic in tests)
- Per-question **hints** and post-answer **fun facts** (`Quiz.jsx`)
- Smoke test: `npm run test:quiz`

### Scoring & retries

- Section retries **replace** prior section scores — no point stacking (`src/utils/progress.js`)
- Totals recomputed from normalized section scores
- Smoke test: `npm run test:retry`

### Progress persistence

- Per-wallet `localStorage` keys: `skillforge.progress.v1.<address>`
- Legacy key migration, schema versioning, malformed JSON sanitization
- Hydration before save to avoid overwrite races (`App.jsx`)
- Smoke test: `npm run test:progress`

### Puzzle redemption

- Atomic 5-point piece purchases; no duplicates or negative balance (`src/utils/puzzle.js`)
- 4×4 certificate puzzle (`PuzzleBoard.jsx`)
- Smoke test: `npm run test:puzzle`

### Smart contract (`SkillForgeCredential.sol`)

| Capability | Status |
| --- | --- |
| Soulbound ERC-721 (no transfer/approve) | Shipped |
| Self-claimed mint — `mintCredential` | Shipped |
| Issuer-attested mint — `mintCredentialWithAuthorization` (EIP-712) | Shipped (contract only) |
| `attested` flag on credential + event | Shipped |
| Nonce increments only after successful attested mint | Shipped |
| Token IDs start at 1; remint replaces prior credential | Shipped |
| On-chain JSON metadata via OpenZeppelin Base64 | Shipped |
| Mainnet deploy gated (`CONFIRM_MAINNET=yes`) | Shipped |

**Hardhat tests:** 11 passing (`npm test`) — ownership, claimed/attested mints, replay, invalid inputs, soulbound restrictions, `tokenURI`.

### Frontend mint & credential display

- Self-claimed mint from `Certificate.jsx` → `mintCredential`
- Reads on-chain credential; shows **Self-claimed** vs **Issuer-attested**
- Snowtrace links for transaction and token
- Resolvable image URI helper (`src/utils/ipfs.js`) — requires `VITE_CREDENTIAL_IMAGE_URI`

**Not in UI yet:** attested mint flow, issuer dashboard, public verification pages.

### Deploy & environment

- `npm run deploy:local` — Hardhat network, no `PRIVATE_KEY`
- `npm run deploy:fuji` — Fuji testnet; writes `deployments/fuji.json`, updates `.env`
- `.env` + `.env.local` merge: empty `.env.local` values no longer wipe `.env` secrets
- `.gitignore` covers `.env`, `artifacts/`, `cache/`, `deployments/*` (except examples)

### CI & quality

- GitHub Actions: `npm ci` → `npm run verify` on every PR and push to `main`
- Local mirror: `npm ci && npm run verify`
- Node 20 (`.nvmrc`)

---

## Phase checklist (roadmap mapping)

### Phase 1 — Foundation & Correctness ✅

- [x] Wallet connection and Fuji network switching
- [x] MetaMask and Core Wallet flows (automated smoke test)
- [x] Quiz generation and randomization
- [x] Easy / Medium / Hard question banks (8 each)
- [x] Retry-safe scoring
- [x] localStorage state recovery
- [x] Puzzle-point redemption logic
- [x] Contract ownership and access control
- [x] Credential score handling (token ID, remint)
- [x] Smart-contract and regression tests
- [x] CI (lint, compile, test, build)

### Phase 2 — Learning Experience 🟡

- [x] Section descriptions and difficulty tiers
- [x] Hints and fun facts during/after quiz
- [x] Dashboard and achievements views
- [x] Persistent learner progression (localStorage)
- [ ] Dedicated onboarding tutorial
- [ ] Post-answer explanations (beyond fun facts)
- [ ] Structured beginner → advanced learning paths
- [ ] Certificate preview polish before first mint

### Phase 3 — Credential System 🟡

- [x] Credential data model (`CredentialData` + metadata JSON)
- [x] Soulbound metadata and artwork URI field
- [x] Claimed vs issuer-attested separation (`attested` flag)
- [x] `mintCredentialWithAuthorization` + EIP-712 nonces
- [x] Replay and unauthorized issuance tests
- [x] On-chain credential read in UI
- [ ] Issuer-key management runbook
- [ ] Frontend attested-mint path
- [ ] Public verification links / QR
- [ ] Credential versioning or revocation policy

### Phases 4–10 — Not started

See [ROADMAP.md](./ROADMAP.md) for XP, backend, issuer dashboard, mainnet, and ecosystem plans.

---

## Test commands

```bash
npm ci
npm run verify          # full CI suite

npm run lint            # ESLint
npm run compile         # Hardhat compile
npm test                # 11 contract tests
npm run test:retry      # scoring regression
npm run test:wallet     # wallet smoke test
npm run test:quiz       # quiz selection
npm run test:progress   # localStorage persistence
npm run test:puzzle     # puzzle redemption
npm run build           # Vite production build
```

---

## Related docs

- [README](../README.md) — quick start, env, deploy, CI
- [ROADMAP.md](./ROADMAP.md) — full 10-phase product plan
- [`.env.example`](../.env.example) — environment template
