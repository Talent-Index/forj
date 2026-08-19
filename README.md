# SkillForge — Avalanche Learning GameFi

[![CI](https://github.com/Talent-Index/SkillForge/actions/workflows/ci.yml/badge.svg)](https://github.com/Talent-Index/SkillForge/actions/workflows/ci.yml)

A gamified skills-credentialing dApp where users learn Avalanche concepts through Easy, Medium, and Hard quizzes, redeem points for puzzle pieces, and mint an on-chain record of claimed scores on Avalanche Fuji.

## Features

- **Wallet connect** — MetaMask or Core Wallet on Avalanche Fuji
- **3 difficulty tiers** — random 5-question quizzes with expanded ICM / L1 content
- **Retry-safe scoring** — section retries replace prior points instead of stacking
- **Progress persistence** — quiz/puzzle state saved per wallet in localStorage
- **Puzzle redemption** — spend points to unlock a 4×4 certificate puzzle
- **On-chain credential** — soulbound NFT via `SkillForgeCredential.sol`
- **Signed mint path** — `mintCredentialWithAuthorization` for owner EIP-712 attestations

> Honesty note: `mintCredential` is a **self-claimed** score record. `mintCredentialWithAuthorization` is **issuer-attested** via an owner EIP-712 signature. Both are soulbound; only the attested path is a privileged credential.

Product + tech sequencing lives in **[docs/ROADMAP.md](docs/ROADMAP.md)**. For what is already built, see **[docs/STATUS.md](docs/STATUS.md)**.

**Current milestone:** Phase 1 (foundation) complete · Phases 2–3 partial · **`SkillForgeCredential` live on Avalanche Fuji**.

Fuji contract: [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df)

---

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 and connect your wallet on Avalanche Fuji.

## Environment

Copy the template and fill in deploy-time values:

```bash
cp .env.example .env
# optional local overrides (non-empty values only override .env)
cp .env.example .env.local
```

```bash
PRIVATE_KEY=                 # deployer only — never commit
FUJI_RPC_URL=https://avalanche-fuji-c-chain.publicnode.com
VITE_CREDENTIAL_CONTRACT=    # set by deploy:fuji or paste from deployments/fuji.json
VITE_CREDENTIAL_IMAGE_URI=   # stable IPFS or HTTPS artwork URL (see docs/METADATA.md)
```

If you use `.env.local`, leave `PRIVATE_KEY` out or set a real value — an empty `PRIVATE_KEY=` line used to wipe the key from `.env` (now prevented in Hardhat config).

If a private key was ever committed historically, **rotate it immediately** and treat it as compromised.

## Deploy Smart Contract (Fuji)

**Live:** `SkillForgeCredential` is already on Fuji at [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df).

To redeploy (new address):

```bash
npm run compile
npm run deploy:fuji
```

This writes `deployments/fuji.json` and sets `VITE_CREDENTIAL_CONTRACT` in your local `.env`. Deployment records are gitignored; commit `deployments/fuji.example.json` shape only.

Also set:

```
VITE_CREDENTIAL_IMAGE_URI=ipfs://...   # or https://...
```

Restart the dev server so Vite picks up the contract address and image URI.

## Mainnet Gate

Mainnet is intentionally gated:

1. Use a reviewed/audited contract build.
2. Prefer `mintCredentialWithAuthorization` with an issuer key.
3. Set a dedicated mainnet RPC + funded deployer key outside git.
4. Update product copy to disclose risks before pointing `avalanche` config at production users.

```bash
# Only after the checklist above
CONFIRM_MAINNET=yes npm run deploy:mainnet
```

## Testing & CI

Every pull request runs the same checks as local `npm run verify`. A failing step blocks the workflow (and should block merge once branch protection is enabled).

### Run everything locally (matches CI)

From a clean install:

```bash
npm ci
npm run verify
```

`verify` runs, in order: lint → compile → Hardhat unit tests → retry/wallet/quiz/progress/puzzle regression scripts → production frontend build.

### Run individual checks

| Command | What it validates |
| --- | --- |
| `npm run lint` | ESLint across the repo |
| `npm run compile` | Solidity contracts compile (`hardhat compile`) |
| `npm test` | Hardhat unit tests (`SkillForgeCredential`) |
| `npm run test:retry` | Section retry scoring (no point stacking) |
| `npm run test:wallet` | Wallet onboarding / Fuji network smoke test |
| `npm run test:quiz` | 5 unique questions per difficulty; explanations and references after submit |
| `npm run test:progress` | Per-wallet progress persistence + sanitization |
| `npm run test:puzzle` | Atomic puzzle piece redemption |
| `npm run test:jigsaw` | Interlocking puzzle geometry and recipient name |
| `npm run test:metadata` | ERC-721 metadata JSON, stable URIs, tokenURI encode/decode |
| `npm run test:onboarding` | Product intro, first-run flow, empty/error copy |
| `npm run build` | Vite production build |

Node **20** is required (see `.nvmrc`).

### GitHub Actions

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

On every **pull request** and every push to **main**:

1. `npm ci` — install from lockfile in a clean environment
2. `npm run verify` — lint, compile, all tests, frontend build

Any step failure fails the job and marks the PR check red.

### Block broken merges (repo admin)

To enforce the acceptance criteria on GitHub:

1. **Settings → Branches → Add branch protection rule** for `main`
2. Enable **Require status checks to pass before merging**
3. Select **`Lint, compile, test, build`** (the CI job name)
4. Enable **Require branches to be up to date before merging**

After that, a broken build or test suite cannot merge into `main`.

## Deploy scripts

```bash
npm run compile
npm run deploy:local   # Hardhat network, no PRIVATE_KEY needed
npm run deploy:fuji    # Avalanche Fuji testnet
```

## Project Structure

```
skillforge/
├── contracts/
│   └── SkillForgeCredential.sol   # soulbound ERC-721 + dual mint paths
├── deployments/                   # local deploy records (*.json gitignored)
├── docs/
│   ├── ROADMAP.md                 # 10-phase product plan
│   ├── STATUS.md                  # implementation progress
│   ├── CREDENTIAL.md              # on-chain credential record (schema v1)
│   └── METADATA.md                # pin artwork + production metadata process
├── metadata/
│   ├── schema/v1.json             # ERC-721 metadata JSON Schema
│   └── examples/                  # claimed and attested fixtures
├── scripts/
│   ├── deploy.js
│   └── check-*.js                 # regression tests (quiz, retry, wallet, …)
├── test/
│   └── SkillForgeCredential.js    # 11 Hardhat tests
├── .github/workflows/ci.yml
└── src/
    ├── components/                # Landing, Quiz, Puzzle, Certificate, …
    ├── data/questions.js          # 16 questions × 3 tiers
    ├── hooks/useWallet.js
    └── utils/                     # progress, puzzle, quiz, contract, wallet
```

## Roadmap & status

- [docs/ROADMAP.md](docs/ROADMAP.md) — learning, GameFi, and credential tracks through mainnet and ecosystem scale
- [docs/STATUS.md](docs/STATUS.md) — shipped features, phase checklist, test commands
- [docs/CREDENTIAL.md](docs/CREDENTIAL.md) — versioned on-chain credential record (schema v1)
- [docs/METADATA.md](docs/METADATA.md) — stable IPFS/HTTPS artwork and metadata process

## Tech Stack

- React + Vite frontend
- viem for wallet interaction
- Hardhat + OpenZeppelin for Avalanche smart contracts
