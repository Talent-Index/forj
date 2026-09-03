# Secrets audit

**Date:** 28 August 2026  
**Scope:** Tracked Git files in this repository (not local `.env` / `.env.local`).  
**Method:** Pattern scan for hex private keys, JWT-shaped tokens, AWS access key ids, and `VITE_`-prefixed secret names.

## Result

| Check | Result |
| --- | --- |
| Tracked files with private-key / mnemonic assignments | **None found** |
| Tracked JWT-shaped secrets | **None found** |
| `VITE_PRIVATE_KEY` / `VITE_PINATA_*` in `.env.example` | **Absent** (correct) |
| `.env` / `.env.local` gitignored | **Yes** |
| Issuer / deployer key in SPA | **Blocked** by `readPublicEnv` + `check-frontend-security` |

Empty placeholders in `.env.example` (`PRIVATE_KEY=`, `PINATA_JWT=`) are intentional. Operators must never commit real values.

## Required operator follow-ups

These cannot be proven from the working tree alone:

1. Scan **Git history** and any forks for past key commits; rotate anything that ever appeared.  
2. Confirm GitHub **secret scanning** and **push protection** are on for the org/repo.  
3. Keep Hardhat `PRIVATE_KEY` and Pinata JWT only in local env or CI secrets — never in `VITE_*`.  
4. After enabling Firebase App Check enforcement, treat reCAPTCHA **secret** keys as server-only (site key may be public).

## Related controls

- Public env allowlist: `src/utils/frontendSecurity.js`  
- CI: `scripts/check-frontend-security.js` (includes `vite.config.js` integrity), `scripts/check-firebase-security.js`  
- Threat model: [THREAT-MODEL.md](./THREAT-MODEL.md)
