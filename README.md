# SkillForge — Avalanche Learning GameFi

A gamified skills-credentialing dApp where users learn Avalanche concepts through Easy, Medium, and Hard quizzes, redeem points for puzzle pieces, and mint an on-chain record of claimed scores on Avalanche Fuji.

## Features

- **Wallet connect** — MetaMask or Core Wallet on Avalanche Fuji
- **3 difficulty tiers** — random 5-question quizzes with expanded ICM / L1 content
- **Retry-safe scoring** — section retries replace prior points instead of stacking
- **Progress persistence** — quiz/puzzle state saved per wallet in localStorage
- **Puzzle redemption** — spend points to unlock a 4×4 certificate puzzle
- **On-chain credential** — soulbound NFT via `SkillForgeCredential.sol`
- **Signed mint path** — `mintCredentialWithAuthorization` for owner EIP-712 attestations

> Honesty note: the open `mintCredential` path stores **claimed** scores. It is not a proctored exam. Use the signed authorization path when you need issuer-attested mints.

Product + tech sequencing lives in **[docs/ROADMAP.md](docs/ROADMAP.md)** (P1 correct mint → P3 attestation / CI / mainnet gate).

---

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 and connect your wallet on Avalanche Fuji.

## Environment

```bash
PRIVATE_KEY=                 # deployer only — never commit
FUJI_RPC_URL=https://avalanche-fuji-c-chain.publicnode.com
VITE_CREDENTIAL_CONTRACT=    # after deploy
VITE_CREDENTIAL_IMAGE_URI=   # stable IPFS or HTTPS artwork URL
```

If a private key was ever committed historically, **rotate it immediately** and treat it as compromised.

## Deploy Smart Contract (Fuji)

```bash
npm run compile
npm run deploy:fuji
```

Set the deployed address in `.env`:

```
VITE_CREDENTIAL_CONTRACT=0xYourContractAddress
VITE_CREDENTIAL_IMAGE_URI=ipfs://...   # or https://...
```

Restart the dev server to enable on-chain minting.

## Mainnet Gate

Mainnet is intentionally gated:

1. Use a reviewed/audited contract build.
2. Prefer `mintCredentialWithAuthorization` with an issuer key.
3. Set a dedicated mainnet RPC + funded deployer key outside git.
4. Update product copy to disclose risks before pointing `avalanche` config at production users.

```bash
# Only after the checklist above
npx hardhat run scripts/deploy.js --network avalanche
```

## Scripts

```bash
npm run lint
npm run compile
npm test
npm run test:retry
npm run deploy:fuji
```

## Project Structure

```
skillforge/
├── contracts/SkillForgeCredential.sol
├── scripts/deploy.js
├── test/
├── .github/workflows/ci.yml
└── src/
    ├── components/
    ├── data/questions.js
    ├── hooks/useWallet.js
    └── utils/
```

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the dual-track plan (mint correctness → product depth → scale), phase status, and mainnet gate.

## Tech Stack

- React + Vite frontend
- viem for wallet interaction
- Hardhat + OpenZeppelin for Avalanche smart contracts
