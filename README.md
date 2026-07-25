# SkillForge — Avalanche Learning GameFi

A gamified skills-credentialing dApp where users learn Avalanche blockchain concepts through Easy, Medium, and Hard quizzes, redeem points for puzzle pieces, and mint verifiable on-chain credentials.

## Features

- **Wallet sign-up** — Connect MetaMask or Core Wallet on Avalanche Fuji
- **3 difficulty tiers** — 5 questions each (Easy: 3pts, Medium: 5pts, Hard: 8pts)
- **Timed quizzes** — Start button, per-question timer, retry anytime
- **Animations & sounds** — Large fullscreen feedback on correct/wrong answers
- **Puzzle redemption** — Spend points (5 pts/piece) to unlock a 4×4 puzzle on your certificate
- **Printable certificate** — Acquired pieces print light green, missing pieces light red
- **On-chain credential** — Soulbound NFT minted via `SkillForgeCredential.sol`

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and connect your wallet on Avalanche Fuji.

## Deploy Smart Contract

```bash
# Copy .env.example to .env and add your deployer PRIVATE_KEY
npm run compile
npm run deploy:fuji
```

Set the deployed address in `.env`:

```
VITE_CREDENTIAL_CONTRACT=0xYourContractAddress
```

Restart the dev server to enable on-chain minting.

## Project Structure

```
skillforge/
├── contracts/SkillForgeCredential.sol   # Soulbound credential NFT
├── scripts/deploy.js
├── src/
│   ├── components/   # Quiz, Puzzle, Certificate, WalletConnect
│   ├── data/questions.js   # Avalanche quiz content
│   ├── hooks/useWallet.js
│   └── utils/contract.js, sounds.js
└── hardhat.config.js
```

## Tech Stack

- React + Vite frontend
- viem for wallet interaction
- Hardhat + OpenZeppelin for Avalanche smart contracts
