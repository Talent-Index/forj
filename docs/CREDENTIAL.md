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

That snapshot is what was written at mint. It is not a live feed of later quiz retries.

## Claimed vs attested

| | Claimed | Issuer-attested |
| --- | --- | --- |
| Who authorizes it | The learner | The contract owner, by signature |
| Product meaning | “I published these scores.” | “An issuer authorized this record.” |
| Learner UI today | This is the mint path | Contract-ready; not the default button |

A claimed credential must not be labeled verified, certified, accredited, or independently assessed. Public lookup and explorer links mean **the token exists**. They do not mean an issuer reviewed the learner.

Unknown or missing status is treated as **claimed**.

## Lookup

Anyone can open a credential by ID or by holder wallet, with a shareable URL and QR. Lookup stays available after sign-in. Lookup does not require the visitor to connect a wallet. Finding a record is not the same as attesting a score.

## Lifecycle

- One **current** credential per wallet. Minting again replaces the previous token.  
- The attested flag on a given token does not flip from claimed to attested.  
- There is no revocation in this version. A future issuer lifecycle will mark credentials revoked or superseded without erasing the historical record.  
- This is not a proctored exam credential.

## Trust

SkillForge separates **learning progress in the app** from **on-chain publication**. App XP and points are not the credential. The credential is only as strong as its mint path: self-published, or owner-signed. Details of signed issuance: [Authorization](./AUTHORIZATION.md). What explorers show: [Metadata](./METADATA.md).
