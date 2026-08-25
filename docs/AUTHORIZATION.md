# Issuer attestation

Issuer-attested credentials exist so a claimed score can later be **authorized**, not so the app can call every mint “verified.”

The learner UI still publishes **self-claimed** records. Attestation is a separate, privileged path: the contract owner signs a precise authorization; the learner (or a permitted submitter) then mints with that signature.

## Intent

- Bind the authorization to **this** SkillForge contract on **this** chain.  
- Bind it to one learner, one score snapshot, one puzzle mask, and one artwork hash.  
- Use it once. A second use of the same authorization fails.  
- Expire it. After the deadline it is no longer valid.  
- If the owner key changes, old signatures from the previous owner do not authorize new mints.

The credential ID is assigned at mint. The signature authorizes the **content**, not a pre-chosen token number. `credentialId` is **not** signed.

Signed domain: `name`, `version`, `chainId`, `verifyingContract`. Signed payload includes `learner`, score snapshot, puzzle mask, `imageHash`, `nonce`, and `deadline`.

## What a signature is not

It is not a degree, a proctored exam, or a general Avalanche certification. It is an on-chain statement that the issuer’s key authorized that score record.

Product copy must keep **claimed** and **attested** distinct. See [Credential](./CREDENTIAL.md).

## Relationship to the learner app

Learning, XP, and the puzzle can happen before a wallet is connected. Attestation only applies when an issuer chooses to sign and a mint uses that signature. Signing keys never live in the learner browser. Until then, any minted record from the learner flow remains claimed.

Issuer organizations, dashboards, and revocation are planned. They do not change the meaning of a claimed score.
