# Launch validation

This is a **fail-closed** public-launch record. It is not an audit report, not Avalanche C-Chain issuance, and **not approval to launch**.

Learner product: [Status](../docs/STATUS.md) · readiness gate: [PRODUCTION-GATE.md](./PRODUCTION-GATE.md) · freeze pack: [PACK.md](./PACK.md).

## Decision

```text
ALL CRITICAL TESTS PASS          ← not signed off (live wallets, devices, issuer UI)
        │
        ▼
SECURITY CHECK PASS              ← not signed off (no independent audit)
        │
        ▼
PRODUCTION CONFIG PASS           ← not signed off (Fuji, not C-Chain production)
        │
        ▼
MAINNET CONTRACT VERIFIED        ← blocked (no C-Chain contract; gate closed)
        │
        ▼
END-TO-END FLOW PASS             ← not signed off (issuer UI missing; production walkthrough not run)
        │
        ▼
┌─────────────────────────┐
│  NOT APPROVED FOR LAUNCH │
└─────────────────────────┘
```

Environment under test: **Avalanche Fuji**. SkillForge does not issue credentials on Avalanche C-Chain today.

## What CI already covers

The Fuji learner loop is checked in source: wallet allowlist and Fuji gating; Easy / Medium / Hard quizzes of five unique questions; retry-safe points and XP; 4×4 interlocking puzzle; recipient-name certificate; claimed mint preparation; public lookup; issuer-authorization rejects on the contract; account isolation.

That coverage is **not** a live MetaMask, Core, mobile-browser, or production-Firebase walkthrough.

## Checklist

| Area | Automated | Live / production | Note |
| --- | --- | --- | --- |
| Wallet connection | Ready | Not run | MetaMask and Core only; Fuji switch; reject / disconnect / restore |
| Easy / Medium / Hard quiz | Ready | Not run | Five questions, shuffle, score, XP, explanations |
| Quiz retry | Ready | Not run | Points replace; XP, achievements, and streak days do not farm |
| Puzzle redemption | Ready | Not run | Duplicate and broke redemptions fail; remainder stays ≥ 0 |
| Complete puzzle | Ready | Not run | 16 unique jigsaw paths; recipient name; forge / blacksmith / diamond |
| Claim credential | Ready (claimed path) | Not run | Learner mint is **claimed** on Fuji; never presented as attested |
| Credential verification | Ready | Not run | Public lookup; unknown status fails closed to claimed; no revocation |
| Issuer-attested mint | Contract rejects | Blocked | No issuer dashboard; signing keys stay out of the learner app |
| Failure scenarios | Copy and isolation | Not run | Understandable errors; progress keyed by account |
| Mobile testing | — | Not run | Deep links exist; devices are not signed off |
| Desktop testing | — | Not run | Chrome / Firefox / Edge / Safari not signed off |
| Persistence | Account isolation | Not run | Learner A cannot keep Learner B’s progress |
| Production environment | Secret scan only | Blocked | No C-Chain contract, issuer ops, or monitoring |

Opening public launch requires the [production readiness gate](./PRODUCTION-GATE.md) to open, a reviewed C-Chain credential, issuer custody, monitoring, and a signed live walkthrough. An env flag must not be enough.

## Honesty

CLAIMED and ISSUER-ATTESTED stay distinct. A self-claimed Fuji score is not an independently verified achievement. Lookup shows that a token exists. Revocation is out of scope for v1.
