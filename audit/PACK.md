# Forjora credential — freeze pack

This pack is for **independent review**. It is not an audit report, not a mainnet launch claim, and not a learner handbook.

Frozen source: `SkillForgeCredential` freeze **v1**. The learner product is **Forjora**. Live Fuji at [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df) is a **prior testnet deployment**. Reviewers must treat source freeze and the live Fuji address as distinct until a freeze-and-redeploy. A future `ForjoraCredential` would be a new deployment, not a rename of this contract.

Product meaning of claimed vs attested: [Credential](../docs/CREDENTIAL.md) · [Authorization](../docs/AUTHORIZATION.md).

## Frozen contract requirements

| Rule | v1 value |
| --- | --- |
| Standard | ERC-721 name `SkillForge Avalanche Credential`, symbol `SFAVAX` |
| Transfer | Soulbound: transfer, approve, and operator approve revert |
| Mint paths | `mintCredential` (claimed, caller only) and `mintCredentialWithAuthorization` (attested) |
| Score cap | `MAX_POINTS = 80`; Easy / Medium / Hard correct each ≤ 5 |
| Puzzle mask | `1 … 0xFFFF` |
| Artwork | Empty, or `ipfs://` / `https://`, ≤ 256 bytes, JSON-safe charset |
| Attestation | EIP-712 name `SkillForgeCredential`, version `1` |
| Authorization window | Deadline ≤ now + 7 days; expired signatures revert |
| Replay | Per-learner nonce; nonce is incremented **before** mint |
| Issuer | Current `owner()` after two-step accept; cannot renounce |
| Token IDs | Assigned at mint, starting at 1; `credentialId` is not signed |
| One current record | Remint burns the previous token for that wallet |
| Metadata | On-chain `tokenURI`; claimed and attested strings stay distinct |
| Callbacks | `_mint`, not `_safeMint` |

EIP-712 type string (frozen):

```text
Credential(address learner,uint256 totalPoints,uint256 puzzleMask,uint8 easyCorrect,uint8 mediumCorrect,uint8 hardCorrect,bytes32 imageHash,uint256 nonce,uint256 deadline)
```

Changing this string, the soulbound rules, or claimed vs attested meaning is a new freeze — not a silent patch of v1.

## Architecture

```text
Learner account  -->  progress, XP, puzzle (off-chain; clients cannot write rank)
Learner wallet   -->  claimed mint  -->  soulbound credential on this contract
Issuer owner key -->  EIP-712 signature -->  attested mint on the same contract
Anyone           -->  public lookup of an existing token
```

The learning app and the credential are separate trust domains. XP and leaderboard standing are not on-chain and are not issuer-attested. Firebase holds account progress under security rules; it cannot mint or attest. The browser never holds the issuer key.

## Threat model

| Threat | Intended outcome |
| --- | --- |
| Attested mint without the owner signature | Revert; no token; nonce unspent |
| Forged, mutated, or malformed signature | Revert; nonce unspent |
| Replay of a used authorization | Revert after first success |
| Wrong nonce, chain, contract, name, or version | Revert |
| Expired or far-future deadline | Revert |
| Pending or previous owner attests | Revert until / after a completed handoff |
| Non-owner transfer / accept / renounce | Revert |
| Second live token for one wallet | Previous token burned; one current ID |
| Transfer or marketplace trade | Soulbound revert |
| JSON-breaking artwork URI | Revert |
| Claimed scores labeled as an exam | Product copy; fail closed to claimed |
| Client publishes inflated claimed scores within caps | Allowed: that is the meaning of claimed |
| Stolen issuer key | Attacker can attest until ownership is moved with two-step accept |
| Mainnet issuance before review | Deployment gate; not a shipped product |

Out of scope for v1: revocation, issuer organizations, proctoring, and treating XP as a credential.

## Privileged roles

| Role | Can do | Cannot do |
| --- | --- | --- |
| Learner (any wallet) | Mint a **claimed** record to themselves | Mint attested; mint into another wallet; transfer the token |
| Issuer (contract owner) | Sign attested authorizations; start a two-step handoff | Abandon the role; attest with a pending-only key |
| Pending owner | Accept a handoff | Attest or transfer onward before accept |
| Public visitor | Read lookup and explorer records | Change claimed vs attested |
| Learner account | Hold progress and XP in the app | Write attested credentials, XP, or rank as raw totals |

## Mint flows

**Claimed.** The connected wallet calls `mintCredential` with a score snapshot and optional artwork. The contract stores `attested = false`. The learner app checks Fuji, the contract address, matching account, score bounds, and `value = 0` before sending. This is the default learner button.

**Attested.** The current owner signs the EIP-712 payload. The **learner** (the signed address) submits `mintCredentialWithAuthorization`. The contract checks expiry, window, signature, and owner, then consumes the nonce and mints `attested = true`. A claimed remint later replaces that token with a new claimed ID; it does not flip the old token.

**Remint.** One current credential per wallet. A new mint burns the previous token and assigns the next ID.

## EIP-712 flow

1. Domain: `name`, `version`, `chainId`, `verifyingContract` — this contract on this chain.  
2. Message: `learner`, score snapshot, puzzle mask, `imageHash` (keccak of the artwork string), `nonce`, `deadline`.  
3. `credentialId` is **not** signed.  
4. Recover ECDSA (65 bytes); signer must be `owner()`; `address(0)` is rejected.  
5. `authorizationNonces[learner] += 1` **before** mint so a revert unspends the nonce and a reentrant receiver cannot reuse the signature.

## Test coverage

See [coverage-report.json](./coverage-report.json). Mocha contract tests cover unauthorized mint, forged and replayed signatures, wrong nonce / chain / contract, expired signatures, unauthorized issuer and ownership, duplicate current credentials, soulbound rules, metadata bounds, and the 80-point cap. Hardhat 3 in this repo does not ship a Solidity line-coverage plugin; the report is a requirement-to-test map, not Istanbul line percentages.

## Findings

**Resolved in freeze v1 (source):** score cap; JSON-safe artwork; bounded image scan; `_mint` instead of receiver callbacks; two-step issuer handoff; no renounce; 7-day authorization window; nonce-before-mint; frontend does not expose deployer secrets; mint transactions are checked before send.

**Accepted residual (not critical for v1 freeze):** the contract does not recompute `totalPoints` from Easy/Medium/Hard weights — claimed means self-published, attested means the issuer signed those fields. No revocation. Single EOA issuer. Live Fuji may lag this source until redeploy. Firebase web config is public client configuration.

## Deployment

Do not treat this pack as permission to issue on Avalanche C-Chain.

- **Fuji live address** is the current testnet credential. Freeze v1 source (two-step owner, 80-point cap, image rules, 7-day window) is what reviewers should read. A production credential needs a freeze-and-redeploy onto a new address, then honest product copy that names that address.  
- **C-Chain** issuance is **closed** by a fail-closed production gate. An env confirmation is not enough. See [PRODUCTION-GATE.md](./PRODUCTION-GATE.md).  
- **Issuer key** stays off the learner device. After deploy, the owner is the attesting issuer until a two-step handoff completes.  
- **Honesty gate:** claimed mint remains the learner path; attested remains owner-signed. Lookup and explorers must not say verified or certified for a claimed record.  
- Deployment records should include `freezeId: "v1"` with the EIP-712 name and version.

Independent review of this freeze is still **remaining**. Forjora is not audited and not live on C-Chain mainnet. Launch validation of the Fuji learner loop is not approval to launch.
