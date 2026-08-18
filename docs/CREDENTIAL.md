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

`puzzleMask` is a 16-bit bitmask (`1..0xFFFF`). `puzzlePieces` is the popcount. `mintedAt` is the Unix timestamp stored at mint.

### `issuer`

| `credentialType` | `issuer.kind` | `issuer.address` |
| --- | --- | --- |
| `self-claimed` | `self` | Learner wallet |
| `issuer-attested` | `contract-owner` | `Ownable.owner()` who signed EIP-712 |

v1 does **not** store the issuer address inside `CredentialData`. Attested mints set `attested = true` and require an owner signature at mint time.

### `metadataUri`

v1 `tokenURI` is an on-chain `data:application/json;base64,...` document (OpenZeppelin Base64), not a separate IPFS JSON file. Artwork lives in `CredentialData.image` / record `imageUri` (`ipfs://` or `https://` when configured).

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
    "mintedAt": 1700000000
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
- **Issuer-attested** (`mintCredentialWithAuthorization`): the contract owner signs the scores (EIP-712). This is the higher-trust path. It is on-chain today; the learner UI still mints self-claimed only.
- This is not a proctored exam credential. Remint replaces the previous token for that wallet.

---

## Tests

```bash
npm run test:credential
```
