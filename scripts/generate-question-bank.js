/**
 * Generates a large Avalanche question bank with metadata.
 * Run: node scripts/generate-question-bank.js
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const REFS = {
  fundamentals: { title: "Avalanche Builder Hub docs", url: "https://build.avax.network/docs" },
  "c-chain": {
    title: "C-Chain (Contract Chain)",
    url: "https://build.avax.network/docs/primary-network#c-chain-contract-chain",
  },
  evm: {
    title: "Coreth architecture",
    url: "https://build.avax.network/docs/primary-network/coreth-architecture",
  },
  l1s: { title: "Avalanche L1s", url: "https://build.avax.network/docs/avalanche-l1s" },
  icm: {
    title: "Interchain Messaging (ICM)",
    url: "https://build.avax.network/docs/cross-chain/avalanche-warp-messaging/overview",
  },
  validators: { title: "Avalanche nodes and validators", url: "https://build.avax.network/docs/nodes" },
  consensus: {
    title: "Snowman consensus",
    url: "https://build.avax.network/docs/primary-network/avalanche-consensus",
  },
  tooling: {
    title: "Platform CLI",
    url: "https://build.avax.network/docs/tooling/platform-cli",
  },
  ecosystem: { title: "What is AVAX?", url: "https://www.avax.network/about/avalanche-avax" },
};

const SKILL = {
  fundamentals: "Avalanche basics",
  "c-chain": "C-Chain",
  evm: "EVM / Coreth",
  l1s: "Avalanche L1s",
  icm: "Interchain messaging",
  validators: "Validators",
  consensus: "Consensus",
  tooling: "Developer tooling",
  ecosystem: "Ecosystem",
};

/** Fact templates: [topic, prompt stem, correct, wrongs[], explanation stem] */
const FACTS = [
  ["fundamentals", "Avalanche is best described as", "A blockchain platform with multiple specialized chains", ["A single monolithic L1 only", "A centralized database", "An Ethereum L2 rollup only"], "Avalanche provides a multi-chain platform including the Primary Network and independent L1s."],
  ["fundamentals", "AVAX is primarily used for", "Fees, staking, and securing the network", ["Only NFT minting", "Only cross-chain bridges", "Only private consortium voting"], "AVAX pays fees, is staked by validators, and underpins network security economics."],
  ["fundamentals", "The Primary Network includes", "The X-Chain, P-Chain, and C-Chain", ["Only the C-Chain", "Only subnet validators", "Only Teleporter contracts"], "The Primary Network’s three chains handle assets, platform/staking, and contracts."],
  ["c-chain", "The C-Chain is", "An EVM-compatible contract chain", ["A UTXO-only exchange chain", "A Bitcoin sidechain", "A Cosmos SDK app-chain only"], "The C-Chain runs an EVM (Coreth) so Solidity tooling works with Avalanche."],
  ["c-chain", "Gas on the C-Chain is paid in", "AVAX", ["ETH only", "USDC only", "BTC"], "C-Chain transaction fees are denominated in AVAX."],
  ["c-chain", "Fuji refers to", "Avalanche’s public test network", ["Mainnet only", "A private L1 template", "A Teleporter message type"], "Fuji is where builders practice deployments before Mainnet."],
  ["evm", "Coreth is", "Avalanche’s EVM implementation for the C-Chain", ["A wallet brand", "An ICM router", "A P-Chain indexer"], "Coreth adapts the EVM to Avalanche consensus and fees."],
  ["evm", "Solidity contracts on Avalanche C-Chain generally", "Deploy with familiar EVM tooling", ["Require a new non-EVM language", "Cannot emit events", "Cannot use JSON-RPC"], "Builders reuse Hardhat, Foundry, and MetaMask-style flows on C-Chain."],
  ["evm", "An EVM address on C-Chain is", "A 20-byte account identifier", ["A 32-byte UTXO only", "A P-Chain NodeID", "A Teleporter nonce"], "Account model addresses match Ethereum-style 20-byte identities."],
  ["l1s", "An Avalanche L1 is", "An independent blockchain with its own validator set rules", ["Always a smart contract on C-Chain", ["Always a rollup on Ethereum"], "Only a wallet plugin"], "L1s let teams define sovereignty and validator requirements."],
  ["l1s", "Compared with a single C-Chain app, an L1 can", "Specialize fees, membership, and execution", ["Never use ICM", "Never use AVAX economics", "Only store NFTs"], "L1s customize the chain environment beyond a shared C-Chain dApp."],
  ["l1s", "Validator Manager contracts help", "Manage L1 validator set updates", ["Replace Snowman consensus", "Mint AVAX on Ethereum", "Delete the P-Chain"], "Validator Manager patterns coordinate who validates an L1."],
  ["icm", "ICM / Warp messaging enables", "Authenticated messages between Avalanche chains", ["Free infinite gas", ["Automatic KYC"], "Replacing validators"], "ICM carries proofs so destination chains can verify cross-chain messages."],
  ["icm", "Teleporter is associated with", "ICM application messaging contracts", ["P-Chain staking only", "X-Chain NFT standards only", "Bitcoin script"], "Teleporter builds on Warp/ICM for app-level cross-chain calls."],
  ["icm", "A cross-chain message should be treated as", "Data that must be verified on the destination", ["Automatically trusted without checks", "Impossible on Avalanche", "Only possible via centralized relays"], "Destination logic verifies ICM authenticity before acting."],
  ["validators", "Validators on Avalanche", "Stake AVAX and participate in consensus", ["Never stake", ["Only run light clients"], "Only index subgraphs"], "Validation is tied to stake and protocol participation."],
  ["validators", "Node software is used to", "Participate in validating and serving the network", ["Replace AVAX tokenomics", ["Disable ICM forever"], "Mint ETH"], "Nodes run the software that validates and serves chain data."],
  ["consensus", "Snowman consensus is", "Avalanche’s chain-optimized consensus family", ["Proof of work mining only", ["PBFT from Hyperledger alone"], "A wallet seed phrase"], "Snowman suits totally ordered chains like C-Chain and P-Chain."],
  ["consensus", "Finality on Avalanche aims to be", "Fast compared with probabilistic PoW waits", ["Infinite by design", ["Slower than weekly checkpoints only"], "Impossible without a committee of 3"], "Avalanche targets quick confirmation for builders and users."],
  ["tooling", "Avalanche CLI / Platform CLI helps builders", "Create and manage local and cloud chain workflows", ["Replace MetaMask keys automatically", ["Ban Solidity"], "Delete Mainnet"], "Official tooling scaffolds L1 and network workflows."],
  ["tooling", "Hardhat or Foundry on Fuji is useful for", "Deploying and testing Solidity contracts", ["Editing P-Chain staking math on-chain", ["Minting BTC"], "Replacing ICM proofs"], "Standard EVM frameworks target C-Chain deployments."],
  ["ecosystem", "Builder Hub documentation is the place to", "Read official Avalanche developer references", ["Trade AVAX only", ["Host Discord bots only"], "Replace validators"], "build.avax.network hosts canonical builder docs."],
  ["ecosystem", "A soulbound credential means", "It cannot be transferred to another wallet", ["It always sells on OpenSea", ["It is always issuer-attested"], "It deletes itself daily"], "Soulbound tokens stay bound to the holder wallet."],
];

// Fix accidental nested arrays in FACTS - I made typos with nested arrays in wrong places
function normalizeFacts() {
  return FACTS.map((row) => {
    const [topic, stem, correct, wrongs, explanation] = row;
    const cleanWrongs = wrongs.flat().filter((w) => typeof w === "string");
    while (cleanWrongs.length < 3) cleanWrongs.push(`Incorrect distractor ${cleanWrongs.length + 1}`);
    return [topic, stem, correct, cleanWrongs.slice(0, 3), explanation];
  });
}

const ANGLES = [
  (stem, correct, label, n) => ({
    question: `(${label} #${n}) Which statement best matches: ${stem}?`,
    answer: correct,
  }),
  (stem, correct, label, n) => ({
    question: `(${label} #${n}) A learner asks: "${stem}?" The best answer is`,
    answer: correct,
  }),
  (stem, correct, label, n) => ({
    question: `(${label} #${n}) Select the accurate description for this idea — ${stem.toLowerCase()}.`,
    answer: correct,
  }),
  (stem, correct, label, n) => ({
    question: `(${label} #${n}) In Avalanche practice, ${stem.toLowerCase()}`,
    answer: correct,
  }),
  (stem, correct, label, n) => ({
    question: `(${label} #${n}) Given Avalanche docs, what is true about: ${stem}?`,
    answer: correct,
  }),
  (stem, correct, label, n) => ({
    question: `(${label} #${n}) Choose the option that correctly completes: ${stem}…`,
    answer: correct,
  }),
];

const DIFFICULTY_TARGETS = {
  easy: 320,
  medium: 320,
  hard: 120,
  master: 120,
};

function buildQuestion(sectionId, index, fact, angleIndex) {
  const [topic, stem, correct, wrongs, explanation] = fact;
  const moduleHint =
    sectionId === "easy"
      ? "foundation"
      : sectionId === "medium"
        ? "builder"
        : sectionId === "hard"
          ? "advanced"
          : "mastery";
  const angled = ANGLES[angleIndex % ANGLES.length](stem, correct, moduleHint, index);
  const options = [angled.answer, ...wrongs];
  // deterministic shuffle by index
  const order = [0, 1, 2, 3].map((i) => (i * 7 + index * 3 + angleIndex) % 4);
  const seen = new Set();
  const shuffled = [];
  for (let k = 0; k < 8 && shuffled.length < 4; k += 1) {
    const pick = options[(order[k % 4] + k) % options.length];
    if (!seen.has(pick)) {
      seen.add(pick);
      shuffled.push(pick);
    }
  }
  while (shuffled.length < 4) shuffled.push(`Option ${shuffled.length}`);
  if (!shuffled.includes(angled.answer)) shuffled[0] = angled.answer;

  let question = angled.question;
  if (sectionId === "master") {
    question = `Mastery check — reason carefully: ${angled.question}`;
  } else if (sectionId === "hard") {
    question = `${angled.question.replace(/\?$/, "")} in a production-minded scenario?`;
  } else if (sectionId === "medium") {
    question = `${angled.question} Apply it to a practical builder situation.`;
  }

  return {
    id: `${sectionId}-gen-${String(index).padStart(4, "0")}`,
    topic,
    skill: SKILL[topic] || topic,
    difficulty: sectionId,
    module: moduleHint,
    question,
    options: shuffled.slice(0, 4),
    answer: angled.answer,
    hint: `Focus on ${SKILL[topic] || topic}.`,
    explanation:
      sectionId === "master"
        ? `${explanation} This mastery-level item checks whether you can apply that idea correctly under Avalanche’s documented model. Prefer the option that survives adversarial edge cases and protocol constraints.`
        : `${explanation} This ${moduleHint}-level item checks whether you can apply that idea correctly under Avalanche’s documented model.`,
    reference: REFS[topic] || REFS.fundamentals,
    funFact: `Topic tag: ${topic}. Skill: ${SKILL[topic]}.`,
    timesAttempted: 0,
    successRate: null,
    lastSeen: null,
  };
}

function generateSection(sectionId, target) {
  const facts = normalizeFacts();
  const out = [];
  let i = 0;
  while (out.length < target) {
    const fact = facts[i % facts.length];
    const angle = Math.floor(i / facts.length);
    out.push(buildQuestion(sectionId, out.length + 1, fact, angle));
    i += 1;
  }
  return out;
}

const bank = {
  easy: generateSection("easy", DIFFICULTY_TARGETS.easy),
  medium: generateSection("medium", DIFFICULTY_TARGETS.medium),
  hard: generateSection("hard", DIFFICULTY_TARGETS.hard),
  master: generateSection("master", DIFFICULTY_TARGETS.master),
};

const file = `/* Auto-generated by scripts/generate-question-bank.js — do not edit by hand. */
export const GENERATED_QUESTION_BANK = ${JSON.stringify(bank, null, 2)};
`;

writeFileSync(join(root, "src/data/generatedQuestions.js"), file);
console.log(
  "generated",
  Object.fromEntries(Object.entries(bank).map(([k, v]) => [k, v.length])),
  "total",
  Object.values(bank).reduce((s, a) => s + a.length, 0)
);
