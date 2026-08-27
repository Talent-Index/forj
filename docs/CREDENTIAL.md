# Credential

The SkillForge credential is a **soulbound** record on Avalanche Fuji. It stores a snapshot of claimed (or attested) scores and puzzle completion. It cannot be transferred.

Live contract: [`0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df`](https://testnet.snowtrace.io/address/0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df).

## What it represents

The record includes:

- Credential ID  
- Holder wallet  
- Total points and Easy / Medium / Hard correct counts  
- Puzzle completion  
- Artwork reference  
- Whether the record is **claimed** or **issuer-attested**  
- When it was minted  
- Network and contract  

The snapshot is what was written at mint. It is not a live feed of later quiz retries.

## Frozen credential

Schema **v1** is frozen for independent review. That freeze is **not** an audit and **not** Avalanche C-Chain issuance.

Frozen rules: soulbound; 80 total points and five correct per difficulty; short `ipfs://` or `https://` artwork; claimed or issuer-attested at mint (never flipped in place); one current record per wallet; owner-signed attestation with a seven-day window and a per-learner nonce.

The live Fuji contract is the current testnet deployment. Freeze v1 source may be redeployed to a new address later. Lookup always names the contract that holds the token.

```text
Account (progress, XP)     Wallet (optional until mint)
        \                         /
         \                       /
          claimed mint -----> soulbound credential
          attested mint --> (same contract, owner signature)
                 \
                  public lookup
```

## Claimed vs attested

| | Claimed | Issuer-attested |
| --- | --- | --- |
| Who authorizes it | The learner | The contract owner, by signature |
| Product meaning | “I published these scores.” | “An issuer authorized this record.” |
| Learner UI today | This is the mint path | Contract-ready; not the default button |

A claimed credential must not be labeled verified, certified, accredited, or independently assessed. Public lookup and explorer links mean **the token exists**. They do not mean an issuer reviewed the learner.

Unknown or missing status is treated as **claimed** (fail closed). Explorer links use **View on Snowtrace**. They show that the token exists.

## Lookup

Anyone can open a credential by ID or by holder wallet, with a shareable URL and QR. Lookup stays available after sign-in. Lookup does not require the visitor to connect a wallet. Finding a record is not the same as attesting a score.

## On-chain record

**Schema version:** `1` (`CREDENTIAL_SCHEMA_VERSION`). The public record fields are:

- `credentialId`
- `walletAddress`
- `score`
- `difficulty`
- `completion`
- `credentialType`
- `verificationStatus`
- `issuer`
- `metadataUri`
- `contractAddress`
- `chainId`
- `version`

Required vs optional fields: the list above is required for a current record. Optional display fields may be empty without changing claimed vs attested.

Score constraints: points and Easy / Medium / Hard counts are the minted snapshot. They cannot exceed the quiz maximums (80 total points, five correct per difficulty). Puzzle completion is a bit mask of seated pieces.

Verification-state transitions: a token stays claimed or attested as minted. A learner remint creates a new token. A claimed record does not become attested in place. `credentialIdsAreUnique` for a wallet’s current set.

Mint time is Unix **seconds**.

## Lifecycle

- One **current** credential per wallet. Minting again replaces the previous token.  
- The attested flag on a given token does not flip from claimed to attested.  
- There is no revocation in this version. A future issuer lifecycle will mark credentials revoked or superseded without erasing the historical record.  
- This is not a proctored exam credential.

## Trust

SkillForge separates **learning progress in the app** from **on-chain publication**. App XP and points are not the credential. The credential is only as strong as its mint path: self-published, or owner-signed. Details of signed issuance: [Authorization](./AUTHORIZATION.md). What explorers show: [Metadata](./METADATA.md).
