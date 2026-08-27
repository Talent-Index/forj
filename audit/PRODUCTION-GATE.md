# Production readiness gate

This is a **fail-closed** gate for Avalanche C-Chain issuance. It is not an audit report and not permission to issue on mainnet.

Learner product: [Status](../docs/STATUS.md) · freeze pack: [PACK.md](./PACK.md).

## Gate

C-Chain issuance is **closed**. Freeze v1 may be reviewed; it is not independently audited.

| Checklist item | Status |
| --- | --- |
| Contract reviewed/audited | Blocked — freeze packed, no audit report |
| Production metadata finalized | Ready — schema v1 claimed vs attested copy is frozen |
| Issuer infrastructure secured | Blocked — keys stay out of the learner app; issuer ops not shipped |
| Production RPC configured | Ready for Fuji lookup; C-Chain RPC is reserved and must not be used as Fuji |
| Deployment wallet secured | Blocked — C-Chain deploy is refused by this gate |
| Monitoring configured | Blocked — not shipped |
| Incident response documented | Ready — no pause; claimed stays claimed; issuer handoff is two-step |
| User disclosures updated | Ready — Privacy and Terms: Fuji-only, claimed vs attested, public records |
| Mainnet configuration reviewed | Reviewed: learner mint stays Fuji; C-Chain issuance is not offered |

Opening issuance requires flipping the source gate after independent review, issuer custody, and monitoring exist. An env flag must not be enough.

Public launch validation is a separate fail-closed record. See [LAUNCH-VALIDATION.md](./LAUNCH-VALIDATION.md). That pack is **not** approval to launch.

## Incident notes

v1 cannot pause claimed mint. Attested mint stops for an old owner after a completed two-step handoff. Tokens already minted do not change from claimed to attested or the reverse. Explorers showing a token do not mean an exam was passed.

## RPC

Fuji lookup must not accept the C-Chain host. C-Chain RPC must not accept Fuji hosts. The learner app mints and looks up on Fuji only.
