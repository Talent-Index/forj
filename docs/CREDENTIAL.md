# SkillForge credential data model

**Schema version:** `1`  
**EIP-712 domain version:** `1`  
**Standard:** `SkillForgeCredential`  
**Live deploy:** Avalanche Fuji (`43113`) at [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df)

This is the versioned credential structure for SkillForge. On-chain storage stays the `CredentialData` struct on `SkillForgeCredential`. The canonical app record composes that struct with deployment context so every credential has a stable, documented shape.

Source of truth in code: [`src/utils/credentialModel.js`](../src/utils/credentialModel.js) (`CREDENTIAL_SCHEMA_VERSION = 1`).

---

## Versioning

| Layer | Field | Current value | Notes |
| --- | --- | --- | --- |
| Canonical record | `schemaVersion` / `version.schema` | `1` | Bump when the documented record shape changes |
| Contract EIP-712 | `version.eip712` | `"1"` | Constructor `EIP712("SkillForgeCredential", "1")` |
| Standard name | `version.standard` | `SkillForgeCredential` | ERC-721 name is `SkillForge Avalanche Credential` |

Schema `1` matches the Fuji contract. Changing on-chain fields requires a new contract and a new schema version. Revocation is **not** in v1.

`version` format:

| Subfield | Type | Rule |
| --- | --- | --- |
| `schema` | integer `>= 1` | Must equal `schemaVersion` |
| `eip712` | string | `/^[0-9]+$/` (currently `"1"`) |
| `standard` | string | Exactly `SkillForgeCredential` |

---

## Required vs optional

Every v1 object includes the keys in `CREDENTIAL_RECORD_FIELDS`. Empty string is not the same as missing.

| Field | Presence | Empty allowed | Notes |
| --- | --- | --- | --- |
| `schemaVersion` | required | no | integer `>= 1` |
| `credentialId` | required | no | decimal token id, `/^[1-9][0-9]{0,77}$/` |
| `score` | required | no | object; see score constraints |
| `difficulty` | required | no | `easy`, `medium`, `hard` entries |
| `completion` | required | no | includes `mintedAt` Unix seconds |
| `credentialType` | required | no | `self-claimed` \| `issuer-attested` |
| `verificationStatus` | required | no | `claimed` \| `attested` |
| `issuer` | required | kind no; address yes | address empty if owner not loaded |
| `chainId` | required | no | positive 32-bit integer |
| `version` | required | no | object, format above |
| `walletAddress` | optional until loaded | yes | required for a complete on-chain read (`requireWallet`) |
| `contractAddress` | optional until loaded | yes | required for a complete on-chain read (`requireContract`) |
| `metadataUri` | optional | yes | ERC-721 `tokenURI`; often a data URI |
| `imageUri` / `explorerUrl` | optional | yes | display helpers, not on-chain struct fields |

Validate with `validateCredentialRecord(record)` or `validateCredentialRecord(record, { requireWallet: true, requireContract: true })`.

---

## Canonical record (schema v1)

| Checklist field | Record path | Type | Source |
| --- | --- | --- | --- |
| Credential ID | `credentialId` | string (decimal token id, starts at `1`) | ERC-721 `tokenId` / `credentialOf(wallet)` |
| Wallet address | `walletAddress` | checksum-normalized `0x` address | Token owner / queried learner |
| Score | `score` | object | `totalPoints` plus per-difficulty counts |
| Difficulty | `difficulty` | `{ easy, medium, hard }` | `easyCorrect`, `mediumCorrect`, `hardCorrect` |
| Completion information | `completion` | object | Quiz counts, puzzle mask/pieces, `mintedAt` |
| Credential type | `credentialType` | `"self-claimed"` \| `"issuer-attested"` | Derived from `attested` |
| Verification status | `verificationStatus` | `"claimed"` \| `"attested"` | On-chain `attested` flag |
| Issuer | `issuer` | `{ kind, address }` | Self = learner; attested = contract owner |
| Metadata URI | `metadataUri` | string | ERC-721 `tokenURI(tokenId)` |
| Contract address | `contractAddress` | `0x` address | Deployment (`VITE_CREDENTIAL_CONTRACT`) |
| Chain ID | `chainId` | number | `43113` on Fuji |
| Version | `version` | `{ schema, eip712, standard }` | This document |

### `score`

```json
{
  "totalPoints": 80,
  "maxPoints": 80,
  "easyCorrect": 5,
  "mediumCorrect": 4,
  "hardCorrect": 3
}
```

`totalPoints` is the value written at mint. It is a **claimed** (or attested) snapshot, not a live localStorage total. Per-question rewards remain Easy 3 / Medium 5 / Hard 8, five questions each (`maxPoints` = 80).

### `difficulty`

Each of Easy, Medium, and Hard:

```json
{
  "id": "easy",
  "name": "Easy",
  "correct": 5,
  "total": 5,
  "complete": true,
  "points": 15
}
```

`complete` is `correct === 5`. Scores above 5 are invalid on-chain and clamped in the record.

### `completion`

```json
{
  "quizCorrect": 12,
  "quizTotal": 15,
  "quizComplete": false,
  "puzzleMask": "15",
  "puzzlePieces": 4,
  "puzzleTotal": 16,
  "puzzleComplete": false,
  "mintedAt": 1700000000
}
```

`puzzleMask` is a 16-bit bitmask (`1..0xFFFF`). `puzzlePieces` is the popcount. `mintedAt` is Unix **seconds** (`0` = unknown; not milliseconds). `mintedAtIso` is the matching UTC ISO-8601 string, or empty when `mintedAt` is `0`.

### `issuer`

| `credentialType` | `issuer.kind` | `issuer.address` |
| --- | --- | --- |
| `self-claimed` | `self` | Learner wallet |
| `issuer-attested` | `contract-owner` | `Ownable.owner()` who signed EIP-712 |

v1 does **not** store the issuer address inside `CredentialData`. Attested mints set `attested = true` and require an owner signature at mint time.

### `metadataUri`

v1 `tokenURI` is an on-chain `data:application/json;base64,...` document (OpenZeppelin Base64), not a separate IPFS JSON file. Artwork lives in `CredentialData.image` / record `imageUri` (`ipfs://` or `https://` when configured). Pin and validate artwork with the process in [METADATA.md](./METADATA.md).

---

## Validation rules

Enforced by `validateCredentialRecord` in [`src/utils/credentialModel.js`](../src/utils/credentialModel.js).

### Field types

| Field | Type |
| --- | --- |
| `schemaVersion` | integer |
| `credentialId` | string |
| `walletAddress`, `contractAddress`, `issuer.address` | string (`""` or `0x` + 40 lowercase hex) |
| `score.*Correct`, `score.totalPoints`, `chainId`, `completion.mintedAt` | integer |
| `credentialType`, `verificationStatus`, `metadataUri` | string |
| `score`, `difficulty`, `completion`, `issuer`, `version` | object |
| `attested` | boolean (alias of verification status) |

### Score constraints

- Easy / Medium / Hard correct: integer `0–5` (contract rejects `> 5`; the record clamps)
- `totalPoints`: integer `>= 1` (contract rejects `0`)
- `totalPoints` is a claimed snapshot and is **not** required to equal `3×easy + 5×medium + 8×hard`
- `maxPoints` is always `80`
- Quiz total correct: `0–15` and equal to Easy + Medium + Hard
- Puzzle mask: decimal string of an integer `1–65535`
- Puzzle pieces: popcount of that mask, `1–16`

### Address and chain formats

- Wallet and contract: `normalizeAddress` → `^0x[a-f0-9]{40}$` (lowercase, 20 bytes). Invalid input becomes `""`, not a raw string.
- Chain ID: positive integer `1–4294967295`. Fuji is `43113`. Invalid values become `0` and fail validation. Missing values default to Fuji.
- Checksum mixed-case input is accepted and stored lowercase.

### Completion timestamp

- `completion.mintedAt`: Unix seconds, integer `0–4102444800` (through 2100-01-01 UTC)
- Millisecond values (`> 4102444800`) are converted to seconds when building
- `completion.mintedAtIso`: `YYYY-MM-DDTHH:mm:ss.sssZ` or `""`

### Credential ID uniqueness

- Token IDs start at `1` and increment (`_nextTokenId++`)
- IDs are globally unique; a burned id is never reused
- One **current** credential per wallet (`credentialOf[wallet]`). Remint burns the previous token and assigns a new id
- `credentialIdsAreUnique(records)` checks a list. `currentCredentialIdByWallet` keeps the highest id per wallet

### Credential type semantics

| `attested` | `credentialType` | `verificationStatus` | `issuer.kind` |
| --- | --- | --- | --- |
| `false` | `self-claimed` | `claimed` | `self` (learner) |
| `true` | `issuer-attested` | `attested` | `contract-owner` |

These four must agree. Self-claimed issuer address, when present, must equal `walletAddress`.

---

## Claimed vs attested (honesty)

A learner-minted score is **self-claimed**. It must not be presented as an issuer-attested assessment.

| State | Who mints | On-chain flag | User-facing label | Metadata `Attestation` |
| --- | --- | --- | --- | --- |
| **Claimed** | The learner, via `mintCredential` | `attested = false` | **Self-claimed** | `Self claimed` |
| **Attested** | The learner, only with an owner EIP-712 signature via `mintCredentialWithAuthorization` | `attested = true` | **Issuer-attested** | `Issuer attested` |

Rules:

- The learner UI mints **only** claimed credentials.
- Unknown or missing status is treated as **claimed** (fail closed). Never upgrade a record to attested from labels such as “verified”.
- Do not call claimed scores verified, certified, or accredited in the product UI.
- Explorer links use **View on Snowtrace** (the token exists on-chain). That is not issuer attestation.
- Public **Lookup** reads the same on-chain record by token ID or holder wallet. A lookup is not issuer attestation.

URLs: `/credential/<id>` (canonical), with optional `?wallet=0x…` to check holder match. Legacy `?token=<id>` and `?wallet=0x…` on `/` still work. Token ID wins if both a path id and `?token=` are present. The page does not require a connected wallet.

Displayed fields: credential title, holder wallet, score, difficulty, credential status, issuer, network, contract address, token ID, transaction hash, explorer link, metadata link. Missing mint logs show **Not indexed** rather than an invented hash.
- Same `tokenId` cannot change status. Remint from the app replaces an attested token with a claimed one.

Display copy lives in [`src/utils/credentialStatus.js`](../src/utils/credentialStatus.js). Metadata strings stay aligned with the live Fuji `tokenURI` renderer.

### Verification-state transitions

Pre-mint state is `none` (no token). v1 has **no revoke**.

| From | To | Same `credentialId` | Allowed |
| --- | --- | --- | --- |
| `none` | `claimed` or `attested` | n/a | yes (mint) |
| `claimed` or `attested` | same status | yes | yes (no-op) |
| `claimed` | `attested` | yes | **no** — flag is immutable on a token |
| `attested` | `claimed` | yes | **no** |
| `claimed` | `attested` | no (remint) | yes |
| `attested` | `claimed` | no (remint) | yes (trust regression) |
| any | `none` | any | **no** |

`canTransitionVerification(from, to, { sameCredentialId })` encodes this.

---

## On-chain `CredentialData` (Fuji)

```solidity
struct CredentialData {
    uint256 totalPoints;
    uint256 puzzleMask;
    uint8 easyCorrect;
    uint8 mediumCorrect;
    uint8 hardCorrect;
    string image;
    uint256 mintedAt;
    bool attested;
}
```

Related mappings:

- `credentialOf[learner] → tokenId` (one current credential per wallet; remint burns the previous token)
- `authorizationNonces[learner]` for attested mints only

Token IDs start at 1. The NFT is soulbound (no transfer or approve).

---

## Example (schema v1)

```json
{
  "schemaVersion": 1,
  "credentialId": "7",
  "walletAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "score": {
    "totalPoints": 80,
    "maxPoints": 80,
    "easyCorrect": 5,
    "mediumCorrect": 4,
    "hardCorrect": 3
  },
  "difficulty": {
    "easy": { "id": "easy", "correct": 5, "total": 5, "complete": true, "points": 15 },
    "medium": { "id": "medium", "correct": 4, "total": 5, "complete": false, "points": 20 },
    "hard": { "id": "hard", "correct": 3, "total": 5, "complete": false, "points": 24 }
  },
  "completion": {
    "quizCorrect": 12,
    "quizTotal": 15,
    "quizComplete": false,
    "puzzleMask": "15",
    "puzzlePieces": 4,
    "puzzleTotal": 16,
    "puzzleComplete": false,
    "mintedAt": 1700000000,
    "mintedAtIso": "2023-11-14T22:13:20.000Z"
  },
  "credentialType": "self-claimed",
  "verificationStatus": "claimed",
  "issuer": {
    "kind": "self",
    "address": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  "metadataUri": "data:application/json;base64,...",
  "contractAddress": "0x3756be4955530bba0844c4d2ecf35db5ed7d90df",
  "chainId": 43113,
  "version": {
    "schema": 1,
    "eip712": "1",
    "standard": "SkillForgeCredential"
  }
}
```

---

## Trust notes

- **Self-claimed** (`mintCredential`): the learner publishes their own scores. Anyone can mint for themselves.
- **Issuer-attested** (`mintCredentialWithAuthorization`): the contract owner signs the scores (EIP-712). This is the higher-trust path. It is on-chain today; the learner UI still mints self-claimed only. Domain, payload, nonce, and deadline rules: [AUTHORIZATION.md](./AUTHORIZATION.md).
- This is not a proctored exam credential. Remint replaces the previous token for that wallet.

---

## Tests

```bash
npm run test:credential
npm run test:eip712
```
