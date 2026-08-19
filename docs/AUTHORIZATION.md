# SkillForge EIP-712 authorization

Issuer-attested mints use `mintCredentialWithAuthorization`. The learner submits an owner signature over EIP-712 typed data. The learner UI does **not** call this path; it mints self-claimed scores only.

Source of truth: [`SkillForgeCredential.sol`](../contracts/SkillForgeCredential.sol)  
Typed-data helpers: [`src/utils/eip712Authorization.js`](../src/utils/eip712Authorization.js)

---

## Authorization model

```text
Issuer (contract owner)
  ↓
EIP-712 typed data
  ↓
Domain separator
  ├── name               SkillForgeCredential
  ├── version            1
  ├── chainId            block.chainid (43113 on Fuji)
  └── verifyingContract  SkillForgeCredential address
  ↓
Authorization payload (struct Credential)
  ├── learner            recipient; must equal msg.sender
  ├── totalPoints        score
  ├── puzzleMask         puzzle completion bitmask
  ├── easyCorrect        difficulty
  ├── mediumCorrect
  ├── hardCorrect
  ├── imageHash          keccak256(bytes(image URI))
  ├── nonce              authorizationNonces[learner]
  └── deadline           unix seconds, inclusive
  ↓
Issuer signature (65-byte ECDSA)
  ↓
On-chain validation
  ├── signature length and recoverability
  ├── recovered signer == owner()
  ├── domain chainId and verifyingContract (via EIP-712)
  ├── nonce == authorizationNonces[msg.sender]
  └── block.timestamp <= deadline
  ↓
Attested credential
```

`credentialId` is **not** signed. Token IDs are assigned at mint (`_nextTokenId`, starting at 1). Binding the recipient, scores, image hash, nonce, and deadline is what uniquely authorizes one attested mint.

---

## Domain

| Field | Value |
| --- | --- |
| `name` | `SkillForgeCredential` (`EIP712_NAME`) |
| `version` | `1` (`EIP712_VERSION`) |
| `chainId` | Current chain (`eip712Domain()` / `block.chainid`) |
| `verifyingContract` | This contract |

OpenZeppelin `EIP712` builds the domain separator. A signature from another chain or another contract recovers a different digest and reverts `Invalid authorization`.

---

## Authorization payload

EIP-712 primary type `Credential`:

```
Credential(address learner,uint256 totalPoints,uint256 puzzleMask,uint8 easyCorrect,uint8 mediumCorrect,uint8 hardCorrect,bytes32 imageHash,uint256 nonce,uint256 deadline)
```

| Field | Contract meaning | Example mapping |
| --- | --- | --- |
| `learner` | Recipient wallet; hashed as `msg.sender` | recipient |
| `totalPoints` | `CredentialData.totalPoints` | score |
| `puzzleMask` | `CredentialData.puzzleMask` | completion |
| `easyCorrect` | `CredentialData.easyCorrect` | difficulty |
| `mediumCorrect` | `CredentialData.mediumCorrect` | difficulty |
| `hardCorrect` | `CredentialData.hardCorrect` | difficulty |
| `imageHash` | `keccak256(bytes(imageData))` | artwork URI binding |
| `nonce` | `authorizationNonces[learner]` | one-time use |
| `deadline` | Inclusive unix seconds | expiry |

Changing any signed field, the recipient, the chain, or the contract invalidates the signature.

---

## On-chain checks

```text
Signature
   ↓
Correct domain?
   ├── Wrong chain     → Invalid authorization
   └── Wrong contract  → Invalid authorization
   ↓
Correct signer?
   ├── Wrong signer / malformed 65-byte ECDSA → Invalid authorization
   ↓
Valid nonce?
   ├── Reused nonce    → Invalid authorization
   ↓
Before deadline?
   ├── timestamp > deadline → Authorization expired
   ├── timestamp == deadline → allowed
   ↓
Consume nonce, then mint attested credential
```

| Check | Behavior |
| --- | --- |
| Domain separator | `_hashTypedDataV4` includes name, version, chain ID, verifying contract |
| Signer | Recovered address must be `owner()` and not `address(0)` |
| Signature format | Exactly 65 bytes; invalid `v`/`s` revert `Invalid authorization` |
| Nonce | Read `authorizationNonces[msg.sender]`, then store `nonce + 1` **before** mint |
| Deadline | `block.timestamp <= deadline` |
| Failed mint / bad inputs | Whole transaction reverts; nonce is not spent |
| Replay | Same signature fails after nonce increment; other learner, scores, or image URI fail the digest |

---

## Issuer procedure

1. Read `authorizationNonces(learner)` and `eip712Domain()`.
2. Sign typed data with the owner key (`EIP712_NAME` / `EIP712_VERSION` / chain / contract).
3. Learner calls `mintCredentialWithAuthorization` with the same scores, image URI, deadline, and signature.
4. Confirm `credentials(tokenId).attested == true`.

Never commit the owner private key. Rotating the owner (`transferOwnership`) invalidates signatures from the previous owner.

The Fuji deploy at [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df) uses this typehash. Redeploy after this hardening if you need the nonce-before-mint and 65-byte signature checks on that address.

---

## Tests

```bash
npm test                 # includes EIP-712 authorization cases
npm run test:eip712      # typed-data field and typehash checks
```
