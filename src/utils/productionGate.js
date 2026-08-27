/** Fail-closed production issuance gate. Not a claim that SkillForge is audited. */

export const C_CHAIN_ID = 43114;
export const PRODUCTION_FREEZE_ID = "v1";

export const PRODUCTION_GATE = Object.freeze({
  freezeId: PRODUCTION_FREEZE_ID,
  mainnetIssuance: false,
  items: Object.freeze({
    independentReview: Object.freeze({
      id: "independentReview",
      label: "Contract reviewed/audited",
      ready: false,
      detail: "Freeze v1 is packed for independent review. There is no audit report.",
    }),
    productionMetadata: Object.freeze({
      id: "productionMetadata",
      label: "Production metadata finalized",
      ready: true,
      detail: "Schema v1 tokenURI copy is frozen: self-claimed vs issuer-attested, never verified or certified for a claimed record.",
    }),
    issuerInfrastructure: Object.freeze({
      id: "issuerInfrastructure",
      label: "Issuer infrastructure secured",
      ready: false,
      detail: "Issuer keys must not live in the learner app. Dedicated issuer operations and key custody are not shipped.",
    }),
    productionRpc: Object.freeze({
      id: "productionRpc",
      label: "Production RPC configured",
      ready: true,
      detail: "Learner lookup uses Fuji only. C-Chain RPC is reserved and must not be used as a Fuji endpoint.",
    }),
    deploymentWallet: Object.freeze({
      id: "deploymentWallet",
      label: "Deployment wallet secured",
      ready: false,
      detail: "C-Chain deploy is refused until this gate opens. A production deployer and issuer key ceremony are not shipped.",
    }),
    monitoring: Object.freeze({
      id: "monitoring",
      label: "Monitoring configured",
      ready: false,
      detail: "Production monitoring is not shipped.",
    }),
    incidentResponse: Object.freeze({
      id: "incidentResponse",
      label: "Incident response documented",
      ready: true,
      detail: "v1 has no pause. Claimed stays claimed. A compromised issuer key is contained by two-step ownership handoff; already-minted tokens do not change type.",
    }),
    userDisclosures: Object.freeze({
      id: "userDisclosures",
      label: "User disclosures updated",
      ready: true,
      detail: "Privacy and Terms state Fuji-only issuance, public chain records, and claimed vs attested.",
    }),
    mainnetConfiguration: Object.freeze({
      id: "mainnetConfiguration",
      label: "Mainnet configuration reviewed",
      ready: true,
      detail: "Reviewed: learner mint stays on Fuji (43113). C-Chain (43114) issuance is not offered.",
    }),
  }),
});

const ISSUANCE_REQUIREMENTS = [
  "independentReview",
  "issuerInfrastructure",
  "deploymentWallet",
  "monitoring",
];

export function mainnetIssuanceAllowed() {
  if (PRODUCTION_GATE.mainnetIssuance !== true) return false;
  return ISSUANCE_REQUIREMENTS.every((id) => PRODUCTION_GATE.items[id].ready === true);
}

export function productionGateSummary() {
  const items = Object.values(PRODUCTION_GATE.items);
  return {
    freezeId: PRODUCTION_GATE.freezeId,
    mainnetIssuanceAllowed: mainnetIssuanceAllowed(),
    ready: items.filter((item) => item.ready).map((item) => item.id),
    blocked: items.filter((item) => !item.ready).map((item) => item.id),
  };
}
