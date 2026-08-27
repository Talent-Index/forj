# Certificate record

When a credential is minted, explorers and wallets read an on-chain JSON document. That document is the public face of the certificate: name, short description, artwork, and a few score traits.

## What it shows

- Title for this credential  
- A description that is either **self-claimed** or **issuer-attested** — never “verified” or “certified” for a claimed record  
- Artwork: a forge certificate image (blacksmith, workshop, crafted diamond) when an image URI is configured  
- Traits: total points, puzzle pieces, Easy / Medium / Hard correct counts, and an attestation trait that matches claimed vs attested  

The JSON itself is produced by the contract from the minted snapshot (`tokenURI`). Artwork must be a short `ipfs://` or `https://` URI so explorers can show it safely — for example `forge-certificate.jpg` on IPFS (Pinata, web3.storage, or equivalent).

## Honesty in the record

Claimed metadata stays self-claimed. Attested metadata stays issuer-attested. Explorer image and “view on Snowtrace” only show that the NFT exists. They do not upgrade a claimed score into an assessment. See [Credential](./CREDENTIAL.md).
