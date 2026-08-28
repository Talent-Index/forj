# Forjora — security architecture and threat model

**Audience:** independent reviewers and maintainers.  
**Status:** architecture map and threat model for the shipped Fuji / Firebase learner product.  
**Not:** a completed penetration test, audit report, mainnet launch approval, or claim that all checklist acceptance criteria below are green.

Related freeze material: [PACK.md](./PACK.md) · [PRODUCTION-GATE.md](./PRODUCTION-GATE.md) · [LAUNCH-VALIDATION.md](./LAUNCH-VALIDATION.md).  
Product honesty: [Credential](../docs/CREDENTIAL.md) · [Authorization](../docs/AUTHORIZATION.md) · [Progression](../docs/PROGRESSION.md).

Review date: **28 August 2026**. Live Fuji contract under review is distinct from any future C-Chain deploy.

---

## 1. System architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser (Vite / React SPA)                                             │
│  Auth session · local progress/XP cache · wallet client (MetaMask/Core) │
└───────────────┬─────────────────────────────┬───────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────────────┐
│  Firebase (skillforge-1)  │   │  Avalanche Fuji (43113)                 │
│  Auth · Firestore ·       │   │  SkillForgeCredential                   │
│  Storage (rules ready;    │   │  0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df │
│  avatar path unused)      │   │  claimed mint · EIP-712 attested mint   │
│  No Cloud Functions       │   │                                         │
│  No App Check             │   │                                         │
└───────────────────────────┘   └─────────────────────────────────────────┘
                │                             │
                ▼                             ▼
        Public RPC / CDN              Snowtrace · optional IPFS artwork
```

### Trust domains (must stay separate)

| Domain | What it proves | What it does **not** prove |
| --- | --- | --- |
| Firebase Auth account | Who signed in | Quiz honesty, credential eligibility |
| Firestore progress / events | What the authenticated client wrote under rules | Issuer-attested skill |
| Local / replayed XP & leaderboard | Gamification standing from client events | Exam score or on-chain authority |
| Claimed NFT | Wallet published a score snapshot within caps | Assessment or attestation |
| Issuer-attested NFT | Current contract `owner()` signed that snapshot | Degree, proctoring, or C-Chain issuance |
| Explorer / public lookup | Token exists on Fuji | “Verified credential” for claimed records |

---

## 2. Trust boundaries

| Boundary | Inside | Outside | Controls today |
| --- | --- | --- | --- |
| **B1 Browser ↔ Firebase** | SPA with Auth ID token | Google / email IdP, Firestore, Storage | Security rules; UI email-verify gate; **no App Check**; **rules do not require `email_verified`** |
| **B2 Browser ↔ Wallet** | App intent UI | Extension / mobile wallet | Fuji-only prep; allowlisted wallets; param validation; user confirms tx |
| **B3 Wallet ↔ Fuji contract** | Signed txs from learner EOA | `SkillForgeCredential` | Solidity access control; soulbound; score caps |
| **B4 Issuer ops ↔ Contract** | Owner key (off-app) | Attested mint path | EIP-712 domain + nonce + deadline; **no learner-UI signing** |
| **B5 Public internet ↔ App host** | Deployed SPA | Anyone | Host TLS (platform); **no in-repo CSP / security headers** |
| **B6 Public ↔ Chain explorers / RPC / IPFS** | Read-only clients | Third parties | URL allowlists in frontend helpers; public RPC trust |
| **B7 CI ↔ Repo / deploy** | GitHub Actions `verify` | Maintainers, secrets store | Lint, tests, check scripts, build; **no Dependabot / CodeQL in-repo** |

There is **no** application API server and **no** Cloud Functions tier. Authorization for off-chain data is almost entirely **Firestore/Storage rules + client honesty**.

---

## 3. Externally exposed services

| Service | Exposure | Notes |
| --- | --- | --- |
| Web SPA (host TBD; Vercel observed in deploy logs) | Public HTTPS | Bundle includes public Firebase web config |
| Firebase Auth | Public client SDK | Email/password + Google; authorized domains must be ops-managed |
| Cloud Firestore | Client SDK under rules | Owner docs + opt-in leaderboard reads |
| Firebase Storage | Rules for `/avatars/{uid}/*`; app does not upload today | Avatars stored as Firestore data URLs |
| Fuji JSON-RPC | Public / configured HTTPS host | Must not point at C-Chain for learner mint |
| Fuji contract | Public chain | Claimed mint is open to any wallet |
| Snowtrace Fuji | Public | Lookup links |
| IPFS gateway (`ipfs.io`) | Public | Artwork resolution when URI configured |
| Google Fonts | Public CDN | Typography |
| Pinata (optional CLI) | Operator JWT — **not** in frontend | Metadata pin scripts only |

---

## 4. Assets by sensitivity

| Asset | Sensitivity | Location | Primary owner* |
| --- | --- | --- | --- |
| Issuer / deployer private key | **Critical** | Operator env / custody only — never `VITE_*`, Git, Firestore, or SPA | Protocol / issuer ops |
| Firebase Auth credentials (passwords, Google tokens) | **Critical** | Firebase Auth | Identity ops |
| Attested mint capability | **Critical** | Current contract `owner()` | Issuer ops |
| Learner email | **High** | Firebase Auth (not mirrored into `users` docs by design) | Identity ops |
| Wallet ↔ uid binding | **High** | `wallets`, `learnerProfiles`, `walletEvents` | Backend rules + product |
| Display name, avatar data URL, recipient name | **Medium–High** | `learnerProfiles`, `quizProgress`, localStorage | Product |
| Quiz progress / puzzle state | **Medium** | Firestore `quizProgress` + localStorage | Product (client-trusted for claimed path) |
| XP / achievements / streaks (product) | **Medium** (integrity-weak) | Local progression + replay of `progressEvents` | Product — **not** a trusted ledger yet |
| Leaderboard standing | **Medium** (integrity-weak) | Opt-in prefs + events | Product |
| Claimed credential NFT | **Medium** | Fuji chain | Learner wallet |
| Issuer-attested credential NFT | **High** (trust claim) | Fuji chain | Issuer + learner |
| Credential metadata / artwork URI | **Medium** | On-chain `tokenURI` + optional IPFS | Issuer / metadata ops |
| Public Firebase web API key / project ids | **Low** (expected public) | Bundle / `src/firebase.js` | Platform |
| Theme / zoom prefs | **Low** | localStorage | Product |

\*Owners are operational roles, not code modules. Until roles are formally assigned, **default owner = repository maintainers**.

### Classification note on XP and points

Locked collections (`xpTransactions`, `achievements`, `streaks`, `credentials`, `issuers`, `roles`, …) are **deny-all** in Firestore. The **live** gamification path still lets authenticated clients create `progressEvents` (and write `quizProgress`) that **become** XP when replayed. Product copy that “clients cannot write XP or rank” means they cannot write XP **total / rank fields** or those deny-all collections — **not** that event-sourced XP is tamper-proof.

---

## 5. Privileged operations

| Operation | Who may perform | Enforcement |
| --- | --- | --- |
| Create Auth user / sign in | Anyone with provider access | Firebase Auth |
| Read/write own profile, quiz cache, wallet link | Authenticated uid (owner) | Firestore rules |
| Publish opt-in leaderboard events | Authenticated owner | Rules + event schema |
| Read others’ opted-in board data | Any authenticated user | Rules (`optIn == true`) |
| `mintCredential` (claimed) | Any EOA for self | Contract |
| Sign EIP-712 attestation | Current contract `owner()` only | Off-chain key + contract recover |
| `mintCredentialWithAuthorization` | Signed learner as `msg.sender` | Contract |
| Transfer / accept ownership | Owner / pending owner | Ownable2Step; renounce disabled |
| Deploy / configure C-Chain issuance | Blocked | `productionGate` fail-closed |
| Pause claimed mint / revoke tokens | **Nobody in v1** | Not implemented |
| Write issuer/credential Firestore collections | **Nobody via client** | Deny-all (reserved) |

**Administrator / issuer dashboard:** not shipped. No Firebase custom claims or `roles` collection in use for the SPA.

---

## 6. Authentication boundaries

| Topic | Current state |
| --- | --- |
| Providers | Email/password + Google (`signInWithPopup`) |
| Email verification | Required for **app “authenticated” UI** (`account.emailVerified`); **not** required in Firestore/Storage rules |
| Password policy | App-side minimum length via auth helpers; Firebase project policy is ops-managed |
| Recovery | Firebase password reset email flow |
| Session | Firebase Auth persistence; `onAuthStateChanged` |
| Account switch | Google `prompt: select_account`; sign-out then sign-in |
| Concurrent sessions | Firebase default (multiple refresh tokens possible) — not specially constrained |
| User enumeration | Relies on Firebase Auth API behavior; not fully mitigated in-app |
| Authorized domains | Must be reviewed in Firebase console for production (not encoded as deny-list in repo) |
| Local mock auth | `src/utils/auth.js` for checks/tests only; can leave legacy `localStorage` keys in old browsers |

**Abuse controls (rate limits, App Check, bot resistance):** not implemented in-repo. Depend on Firebase platform defaults and future App Check.

---

## 7. Authorization boundaries

| Role | Permissions |
| --- | --- |
| **Anonymous / signed-out** | Marketing SPA; public credential lookup by design; no Firestore owner writes |
| **Authenticated learner (UI)** | Own profile/progress; puzzle; claimed mint prep; opt-in leaderboard; no attested mint UI |
| **Authenticated learner (raw SDK)** | Anything rules allow for their uid — including writing allowed `progressEvents` / `quizProgress` without UI checks |
| **Issuer (contract owner)** | Off-chain EIP-712 signatures; ownership handoff |
| **Administrator (Firebase)** | Not modeled in app rules; Google Cloud / Firebase console operators are out-of-band superusers |
| **Public chain observer** | Read tokens, metadata, Snowtrace |

**Critical authorization principle (target state):** never trust the frontend for XP, points, level, credential eligibility, issuer permission, or achievement completion.  
**Current state:** on-chain attested path meets this for **attestation**; off-chain XP/leaderboard and claimed score **inputs** do **not**.

### Horizontal access (IDOR-style)

| Resource | Cross-user read | Cross-user write |
| --- | --- | --- |
| `learnerProfiles` / `users` / `quizProgress` | Denied | Denied |
| `leaderboardPreferences` / `progressEvents` with `optIn` | Allowed (by design) | Write only as owner; delete denied for events |
| `wallets` active | Owner (released readable more broadly) | Cannot reassign `userId` |
| Deny-all credential/issuer collections | Denied | Denied |

---

## 8. Firebase trust assumptions

1. Google/Firebase correctly authenticates users and protects Auth credentials.  
2. Deployed `firestore.rules` / `storage.rules` match this repository and are the real enforcement point.  
3. Reserved deny-all collections stay unused until a trusted backend exists.  
4. Firebase **cannot** mint or attest on-chain credentials.  
5. Without App Check or Functions, **any** client with a valid user token can exercise allowed writes.  
6. Email verification is a **product** gate, not a rules gate, unless rules are tightened.  
7. Public web config in the bundle is expected; it is not an issuer key.  
8. Analytics payloads are constrained by rules; Analytics SDK may still collect platform telemetry.

---

## 9. Blockchain trust assumptions

1. Fuji (and any future chain) provides integrity of contract code and state after deploy.  
2. Claimed mint is **self-publication within caps**, not an exam.  
3. Attested mint proves **only** that the current `owner()` key authorized that exact snapshot (domain-bound).  
4. Soulbound rules prevent marketplace transfer of the token.  
5. No pause and no revocation in v1 — issuer key compromise is high impact until two-step ownership completes.  
6. Contract does not recompute weighted `totalPoints` from difficulty counts (accepted residual in freeze pack).  
7. Live Fuji bytecode may lag freeze **v1** source until redeploy.  
8. Public RPC and explorers are availability/integrity-trusted for reads only.  
9. Production C-Chain issuance remains **fail-closed** (`mainnetIssuanceAllowed() === false`).

---

## 10. Attack surfaces

### A. Web application

- Auth UI (signup, sign-in, reset, Google popup)  
- Profile / avatar (data URL) / recipient name  
- Quiz answers and progress sync  
- Leaderboard preference and event publication  
- Credential lookup routes and query parameters  
- Wallet connect / network switch / claimed mint transaction construction  
- Static content links and explorer URLs  

### B. Firebase

- Firestore rule bypass / confused deputy via SDK  
- Unverified-email sessions writing data  
- Leaderboard farming via `progressEvents` (especially flexible `LESSON_COMPLETED` source ids)  
- `quizProgress` inflation within loosely validated maps  
- Storage avatar path (if enabled later) — type/size rules exist; path unused  
- Auth abuse (credential stuffing, reset spam) — platform-dependent  

### C. Web3

- Wrong-chain / wrong-contract signature use  
- Attested mint forgery / replay / nonce / deadline attacks  
- Unauthorized ownership actions  
- Claimed mint spam / score inflation (in-scope as claimed honesty)  
- Malicious dApp tx parameter manipulation (mitigated by prep helpers; user still signs)  
- Issuer key theft (P0 operational risk)  

### D. Supply chain / ops

- Dependency compromise  
- Secrets in Git or `VITE_*`  
- CI privilege / deploy branch protection (ops)  
- Hosting without security headers  

---

## 11. Threat model (by asset)

| Threat | Asset | Impact | Likelihood (current design) | Intended / residual outcome |
| --- | --- | --- | --- | --- |
| Attested mint without owner signature | Credentials / issuer trust | Critical | Low if key held correctly | Contract revert; covered by adversarial tests |
| EIP-712 replay / cross-chain / cross-contract | Credentials | Critical | Low | Domain + nonce + deadline; tests in `test/SkillForgeAdversarial.js` |
| Issuer key in frontend or Git | Issuer infrastructure | Critical | Low if process followed | CI/frontend checks block `PRIVATE_KEY` in public env; ops must keep `.env` clean |
| Stolen issuer key | Attested credentials | Critical | Ops-dependent | No pause; two-step ownership only; **residual** |
| Claimed score / mint inflation | Claimed credential | Medium (honesty) | High if adversarial learner | **Accepted** for claimed path; copy must not say verified |
| XP / leaderboard farming via client events | Progression / board | Medium–High (product integrity) | High | **Residual** — no server adjudication |
| Cross-user profile/progress read/write | Learner accounts | High | Low if rules deployed | Owner checks; deny-by-default catch-all |
| Unverified email using Firestore | Learner data | Medium | Medium | **Residual** — rules ignore `email_verified` |
| XSS → session/tx trickery | Accounts / wallet | High | Low–Medium | No `dangerouslySetInnerHTML`; URL/media sanitizers; **no CSP** |
| Malicious artwork / avatar URI | Browser | Medium | Low | `safeMediaSrc` / `safeAvatarSrc`; SVG data URLs rejected |
| Wallet on wrong network | Funds / failed mint | Medium | Medium | Fuji gate + prep rejection |
| Seed phrase phishing via UI | Wallet | Critical | Process | App must never ask; none in code paths reviewed |
| Firestore reserved collection enablement without backend | Credentials / issuer | Critical | Future risk | Keep deny-all until trusted writers exist |
| Dependency RCE in build | Supply chain | High | Low–Medium | `npm audit` high gate in verify; no Dependabot config |
| Hosting header stripping / clickjacking | Session UX | Medium | Medium | **Residual** — headers not in repo |
| Public lookup overshared as “verified” | Reputation / honesty | High (product) | Process | Copy + status badges; regression checks |

---

## 12. Security owners (critical components)

Assign named humans in ops; defaults until then:

| Component | Security owner role |
| --- | --- |
| Issuer / deployer keys & rotation | Issuer ops lead |
| Firebase project (Auth domains, rules deploy, IAM) | Platform / Firebase admin |
| Smart contract freeze & adversarial suite | Protocol engineer |
| SPA frontend security helpers & CI `verify` | App engineer |
| Production / launch gates | Release owner |
| Incident response (key compromise, rules breach) | On-call maintainer |

---

## 13. Checklist coverage vs this document

This file completes the **recommended first step**: architecture map, trust boundaries, assets, privileged ops, exposed services, authz/authn boundaries, Firebase/chain assumptions, threat model, and attack surfaces.

It does **not** by itself satisfy the full 23-section execution checklist or the final security gate acceptance criteria. Notable **open** items for later phases:

| Area | Gap |
| --- | --- |
| App Check | Not enabled |
| Trusted XP / quiz validation | No Cloud Functions / server referee |
| Firestore `email_verified` | Not enforced |
| Security headers / CSP | Not in repo |
| Rate limiting | No app-layer limits |
| Dependabot / secret scanning / branch protection | Ops / GitHub settings (not fully represented in repo) |
| Storage uploads | Rules exist; unused path |
| Issuer infrastructure & monitoring | Production-gate blocked |
| Independent pen test | Not claimed |
| Launch / C-Chain | Fail-closed not approved |

---

## 14. Suggested next execution order

1. **Secrets audit** — confirm no keys in Git history; rotate anything ever exposed; keep issuer keys offline from the SPA.  
2. **Firebase hardening** — enforce `email_verified` in rules where appropriate; enable App Check; rules tests in CI against emulator.  
3. **XP / reward integrity** — move reward-granting writes behind trusted adjudication (or explicitly keep leaderboard “untrusted fun” in product copy and gate).  
4. **HTTP headers / CSP** on the production host.  
5. **Continue** wallet, contract, issuer-key ops, dependency/CI, then pen test and regression suite per the program checklist.

---

## 15. Evidence index (implementation)

| Topic | Primary paths |
| --- | --- |
| Firestore / Storage rules | `firestore.rules`, `storage.rules`, `src/utils/backend/schema.js` |
| Auth | `src/hooks/useAuth.js`, `src/firebase.js` |
| Frontend sanitizers | `src/utils/frontendSecurity.js`, `scripts/check-frontend-security.js` |
| Wallet / mint prep | `src/utils/wallet.js`, `src/utils/contract.js`, `src/components/Certificate.jsx` |
| EIP-712 | `contracts/SkillForgeCredential.sol`, `src/utils/eip712Authorization.js`, `scripts/check-eip712.js` |
| Adversarial tests | `test/SkillForgeAdversarial.js`, `test/SkillForgeAuthorization.js` |
| Gates | `src/utils/productionGate.js`, `src/utils/launchValidation.js` |
| CI | `.github/workflows/ci.yml` → `npm run verify` |
