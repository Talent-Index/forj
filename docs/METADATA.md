# SkillForge production metadata

**Schema version:** `1`  
**Artwork:** [`src/assets/forge-certificate.jpg`](../src/assets/forge-certificate.jpg) (blacksmith presenting a crafted diamond)  
**On-chain renderer:** `SkillForgeCredential.tokenURI` returns `data:application/json;base64,...`  
**Image field:** operator-supplied **IPFS or HTTPS** URI stored in `CredentialData.image`

Explorers read `tokenURI`, decode the JSON, then load `image`. Local Vite paths are not usable on Snowtrace. Do not mint with Unsplash or other hotlinked stock photos.

---

## Metadata JSON (v1)

Matches what the live Fuji contract emits:

```json
{
  "name": "SkillForge Avalanche Credential #1",
  "description": "Self-claimed SkillForge score record on Avalanche.",
  "image": "ipfs://<cid>",
  "attributes": [
    { "trait_type": "Total Points", "value": 15 },
    { "trait_type": "Puzzle Pieces", "value": 1 },
    { "trait_type": "Easy Correct", "value": 5 },
    { "trait_type": "Medium Correct", "value": 0 },
    { "trait_type": "Hard Correct", "value": 0 },
    { "trait_type": "Attestation", "value": "Self claimed" }
  ]
}
```

| Field | Rule |
| --- | --- |
| `name` | `SkillForge Avalanche Credential #<tokenId>` |
| `description` | Claimed or attested sentence (see contract) |
| `image` | Optional. If present: `ipfs://<cid>` or `https://` host, no `"`, no whitespace |
| `attributes` | The six traits above, in that order on-chain |

Schema file: [`metadata/schema/v1.json`](../metadata/schema/v1.json)  
Examples: [`metadata/examples/`](../metadata/examples/) — the CID in those files is a **format fixture**, not SkillForge art. Production must pin `forge-certificate.jpg`.  
Builder: [`src/utils/credentialMetadata.js`](../src/utils/credentialMetadata.js)

Issuer-attested tokens use description `Issuer-attested SkillForge credential on Avalanche.` and trait `Issuer attested`.

---

## Production process

1. **Artwork** — use `src/assets/forge-certificate.jpg` (certificate illustration).
2. **Pack** — `npm run metadata:pack` copies artwork to `metadata/packed/` and writes a JSON template.
3. **Pin artwork** (pick one):
   - Pinata: set `PINATA_JWT` (never commit it), then `npm run metadata:upload`
   - web3.storage / NFT.Storage / `ipfs add`
   - Durable HTTPS on your own host (not a CDN thumbnail with tracking params)
4. **Configure** — `VITE_CREDENTIAL_IMAGE_URI=ipfs://<cid>` or `https://...` in `.env`. Restart Vite.
5. **Mint** — the app writes that URI into `CredentialData.image`. `tokenURI` embeds it in on-chain JSON.
6. **Verify** — open the token on Snowtrace, confirm `tokenURI` JSON, then confirm the image loads from IPFS/HTTPS.

The Fuji contract is already deployed. You do **not** redeploy to change artwork; remint with the new image URI. Remint burns the previous token.

---

## URI rules

Accepted:

- `ipfs://Qm...` (CIDv0)
- `ipfs://bafy...` / `ipfs://bafk...` (CIDv1)
- `https://` with a real hostname

Rejected:

- `http://`
- `javascript:`
- quotes or backslashes (the contract rejects `"`)
- local `/src/assets/...` paths
- hotlink hosts (`images.unsplash.com`, `picsum.photos`, placeholders)

`tokenURI` itself is an on-chain `data:application/json;base64,...` URI. Pin the **artwork**; do not replace Solidity `tokenURI` with an IPFS JSON URI unless you redeploy.

`npm run test:metadata` checks packing, URI validation, data-URI retrieval, and tokenURI encode/decode.

---

## Commands

```bash
npm run metadata:pack
npm run metadata:upload   # no-op without PINATA_JWT
npm run test:metadata
```
