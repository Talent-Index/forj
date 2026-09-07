/**
 * Data-driven Avalanche learning catalog.
 * UI should read this file instead of hardcoding track or path rules.
 */

export const LEARNING_CATALOG_VERSION = 2;

export const QUIZ_MODULE_IDS = {
  easy: "fund-quiz",
  medium: "arch-quiz",
  hard: "dev-quiz",
};

export const QUIZ_TRACK_IDS = {
  easy: "fundamentals",
  medium: "architecture",
  hard: "developer",
};

const REF = {
  docs: { title: "Avalanche Builder Hub", url: "https://build.avax.network/docs" },
  primary: { title: "Avalanche Primary Network", url: "https://build.avax.network/docs/primary-network" },
  consensus: {
    title: "Snowman consensus",
    url: "https://build.avax.network/docs/primary-network/avalanche-consensus",
  },
  l1s: { title: "Avalanche L1s", url: "https://build.avax.network/docs/avalanche-l1s" },
  l1Create: {
    title: "Create an Avalanche L1",
    url: "https://build.avax.network/docs/tooling/avalanche-cli/create-avalanche-l1",
  },
  validatorManager: {
    title: "Validator Manager",
    url: "https://build.avax.network/docs/avalanche-l1s/validator-manager/contract",
  },
  cChain: {
    title: "C-Chain (Contract Chain)",
    url: "https://build.avax.network/docs/primary-network#c-chain-contract-chain",
  },
  coreth: {
    title: "Coreth architecture",
    url: "https://build.avax.network/docs/primary-network/coreth-architecture",
  },
  icm: {
    title: "Avalanche Warp Messaging",
    url: "https://build.avax.network/docs/cross-chain/avalanche-warp-messaging/overview",
  },
  icmContracts: {
    title: "ICM contracts (Teleporter)",
    url: "https://build.avax.network/docs/cross-chain/icm-contracts/overview",
  },
  nodes: { title: "Nodes and validators", url: "https://build.avax.network/docs/nodes" },
  tooling: {
    title: "Avalanche tooling",
    url: "https://build.avax.network/docs/tooling/platform-cli",
  },
  avax: { title: "What is AVAX?", url: "https://www.avax.network/about/avalanche-avax" },
};

export const LEARNING_PATHS = [
  {
    id: "avalanche-developer-path",
    name: "Avalanche Developer Path",
    description:
      "A structured path from Avalanche fundamentals through architecture, L1s, C-Chain, ICM, and a developer capstone.",
    trackIds: ["fundamentals", "architecture", "l1s", "c-chain", "icm", "developer"],
  },
];

export const TRACKS = [
  {
    id: "fundamentals",
    name: "Avalanche Fundamentals",
    description: "What Avalanche is, how the Primary Network is organized, and how AVAX is used.",
    difficulty: "beginner",
    prerequisites: [],
    xpReward: 100,
    pointReward: 0,
    credential: { type: "track", claimed: true, attested: false },
    moduleIds: ["fund-lessons", "fund-quiz"],
  },
  {
    id: "architecture",
    name: "Avalanche Architecture",
    description: "Primary Network chains, Snowman consensus, and the validator set that secures them.",
    difficulty: "intermediate",
    prerequisites: ["fundamentals"],
    xpReward: 120,
    pointReward: 0,
    credential: { type: "track", claimed: true, attested: false },
    moduleIds: ["arch-lessons", "arch-quiz"],
  },
  {
    id: "l1s",
    name: "Avalanche L1s",
    description: "Independent L1s, validator-set sovereignty, and when to launch an L1 instead of a contract.",
    difficulty: "intermediate",
    prerequisites: ["architecture"],
    xpReward: 120,
    pointReward: 0,
    credential: { type: "track", claimed: true, attested: false },
    moduleIds: ["l1-lessons"],
  },
  {
    id: "c-chain",
    name: "C-Chain & Smart Contracts",
    description: "The EVM C-Chain, gas paid in AVAX, and how contracts deploy on Fuji and Mainnet.",
    difficulty: "intermediate",
    prerequisites: ["architecture"],
    xpReward: 120,
    pointReward: 0,
    credential: { type: "track", claimed: true, attested: false },
    moduleIds: ["cchain-lessons"],
  },
  {
    id: "icm",
    name: "Avalanche ICM",
    description: "Interchain Messaging, Warp/Teleporter, and authentic messages between Avalanche chains.",
    difficulty: "advanced",
    prerequisites: ["l1s"],
    xpReward: 140,
    pointReward: 0,
    credential: { type: "track", claimed: true, attested: false },
    moduleIds: ["icm-lessons"],
  },
  {
    id: "developer",
    name: "Avalanche Developer Track",
    description: "Tooling, Fuji practice, and the Hard assessment that closes the developer path.",
    difficulty: "advanced",
    prerequisites: ["c-chain", "icm"],
    xpReward: 160,
    pointReward: 0,
    credential: { type: "path-capstone", claimed: true, attested: false },
    moduleIds: ["dev-lessons", "dev-quiz"],
  },
];

/**
 * Off-chain track certificates. Quiz tracks spend that quiz's points on a
 * reserved piece range (Easy 3, Medium 5, Hard 8 = 16). Lesson tracks
 * complete when the track itself completes. The on-chain claimed record
 * remains one soulbound snapshot of the path.
 */
export const TRACK_CERTIFICATES = Object.freeze([
  {
    id: "fundamentals",
    trackId: "fundamentals",
    title: "Fundamentals Certificate",
    quizId: "easy",
    quizLabel: "Easy",
    icon: "learn",
    pieceIndexes: Object.freeze([0, 1, 2]),
    kind: "quiz",
  },
  {
    id: "architecture",
    trackId: "architecture",
    title: "Architecture Certificate",
    quizId: "medium",
    quizLabel: "Medium",
    icon: "progress",
    pieceIndexes: Object.freeze([3, 4, 5, 6, 7]),
    kind: "quiz",
  },
  {
    id: "l1s",
    trackId: "l1s",
    title: "L1s Certificate",
    quizId: null,
    quizLabel: null,
    icon: "path",
    pieceIndexes: Object.freeze([]),
    kind: "track",
  },
  {
    id: "c-chain",
    trackId: "c-chain",
    title: "C-Chain Certificate",
    quizId: null,
    quizLabel: null,
    icon: "wallet",
    pieceIndexes: Object.freeze([]),
    kind: "track",
  },
  {
    id: "icm",
    trackId: "icm",
    title: "ICM Certificate",
    quizId: null,
    quizLabel: null,
    icon: "board",
    pieceIndexes: Object.freeze([]),
    kind: "track",
  },
  {
    id: "developer",
    trackId: "developer",
    title: "Developer Certificate",
    quizId: "hard",
    quizLabel: "Hard",
    icon: "badge",
    pieceIndexes: Object.freeze([8, 9, 10, 11, 12, 13, 14, 15]),
    kind: "quiz",
  },
]);

export const MODULES = [
  {
    id: "fund-lessons",
    trackId: "fundamentals",
    name: "Fundamentals lessons",
    required: true,
    optional: false,
    quizId: null,
    lessonIds: ["fund-what", "fund-chains", "fund-avax"],
    prerequisites: [],
  },
  {
    id: "fund-quiz",
    trackId: "fundamentals",
    name: "Fundamentals assessment",
    required: true,
    optional: false,
    quizId: "easy",
    lessonIds: [],
    prerequisites: ["fund-lessons"],
  },
  {
    id: "arch-lessons",
    trackId: "architecture",
    name: "Architecture lessons",
    required: true,
    optional: false,
    quizId: null,
    lessonIds: ["arch-primary", "arch-consensus", "arch-validators"],
    prerequisites: [],
  },
  {
    id: "arch-quiz",
    trackId: "architecture",
    name: "Architecture assessment",
    required: true,
    optional: false,
    quizId: "medium",
    lessonIds: [],
    prerequisites: ["arch-lessons"],
  },
  {
    id: "l1-lessons",
    trackId: "l1s",
    name: "Avalanche L1 lessons",
    required: true,
    optional: false,
    quizId: null,
    lessonIds: ["l1-what", "l1-validators", "l1-custom"],
    prerequisites: [],
  },
  {
    id: "cchain-lessons",
    trackId: "c-chain",
    name: "C-Chain lessons",
    required: true,
    optional: false,
    quizId: null,
    lessonIds: ["cchain-evm", "cchain-gas", "cchain-contracts"],
    prerequisites: [],
  },
  {
    id: "icm-lessons",
    trackId: "icm",
    name: "ICM lessons",
    required: true,
    optional: false,
    quizId: null,
    lessonIds: ["icm-what", "icm-teleporter", "icm-use"],
    prerequisites: [],
  },
  {
    id: "dev-lessons",
    trackId: "developer",
    name: "Developer lessons",
    required: true,
    optional: false,
    quizId: null,
    lessonIds: ["dev-tooling", "dev-fuji", "dev-practice"],
    prerequisites: [],
  },
  {
    id: "dev-quiz",
    trackId: "developer",
    name: "Developer capstone",
    required: true,
    optional: false,
    quizId: "hard",
    lessonIds: [],
    prerequisites: ["dev-lessons"],
  },
];

export const LESSONS = [
  {
    id: "fund-what",
    moduleId: "fund-lessons",
    title: "What Avalanche is",
    optional: false,
    reference: REF.docs,
    body: "Avalanche is a proof-of-stake network built for fast, irreversible finality. Instead of one monolithic chain for every workload, Avalanche separates shared security and messaging from application-specific execution.\n\nThe Primary Network is the shared base: validators stake AVAX there, and other Avalanche chains connect to that common security and messaging layer. That design is why L1s, the C-Chain, and ICM show up together in later tracks.\n\nForjora uses this track to ground those later lessons. Completing the Easy quiz records a claimed fundamentals score — it is not an issuer-attested credential.",
  },
  {
    id: "fund-chains",
    moduleId: "fund-lessons",
    title: "The three Primary Network chains",
    optional: false,
    reference: REF.primary,
    body: "The Primary Network has three chains with different jobs. The C-Chain runs the Ethereum Virtual Machine for contracts and familiar EVM tooling. The P-Chain coordinates validators, staking, and L1 membership. The X-Chain handles native asset creation and exchange.\n\nYou do not pick one chain and ignore the others. Fees, staking, subnet/L1 registration, and cross-chain messages all depend on how these three chains work together.\n\nWhen a wallet shows “Avalanche C-Chain,” that is only the contract surface. Validator and L1 operations still land on the P-Chain.",
  },
  {
    id: "fund-avax",
    moduleId: "fund-lessons",
    title: "AVAX, fees, and staking",
    optional: false,
    reference: REF.avax,
    body: "AVAX is the native asset of the Avalanche network. You pay C-Chain gas with it, stake it to validate the Primary Network, and use it as the unit of account across Primary Network activity.\n\nFuji is the public test network. Test AVAX has no Mainnet market value. Forjora records its learning credential on Fuji so you can practice minting without Mainnet funds.\n\nTreat Fuji practice as rehearsal: the workflow matches Mainnet shapes, but a Fuji record is not a Mainnet or issuer-attested diploma.",
  },
  {
    id: "arch-primary",
    moduleId: "arch-lessons",
    title: "Primary Network architecture",
    optional: false,
    reference: REF.primary,
    body: "Every Avalanche L1 validator also validates the Primary Network. That shared validator commitment is how Avalanche can carry authentic messages between chains without asking a trusted relay to invent truth.\n\nArchitecture here is about roles: the Primary Network secures and coordinates; an L1 executes its own rules. When you later study L1s, remember they are sovereign execution environments that still sit inside this shared architecture.\n\nIf a diagram separates “my L1” from “Avalanche,” ask how validators and messaging still bind them. That binding is the point of the Medium quiz.",
  },
  {
    id: "arch-consensus",
    moduleId: "arch-lessons",
    title: "Snowman consensus",
    optional: false,
    reference: REF.consensus,
    body: "Snowman is the linear-chain member of the Snow family of consensus protocols. Validators repeatedly sample small random subsets of peers instead of running a classical all-to-all BFT round on every decision.\n\nThat sampling is why finality can be fast and irreversible once a transaction is accepted. There is no probabilistic “wait N blocks and hope” model like proof-of-work chain tips.\n\nForjora quizzes treat Snowman as required vocabulary: sampling, preference, and finality — not buzzwords, but the reason Avalanche feels responsive under load.",
  },
  {
    id: "arch-validators",
    moduleId: "arch-lessons",
    title: "Validators and staking",
    optional: false,
    reference: REF.nodes,
    body: "Validators stake AVAX and participate in consensus. The P-Chain tracks who is in the validator set and for how long. Nodes that do not stake can still follow the network as full nodes or RPC providers.\n\nStaking is economic security, not a username. Unstaking and set changes are protocol operations on the P-Chain, which is why wallet network mistakes matter when you move from reading docs to operating nodes.\n\nThe Medium quiz checks this architecture, including how C-Chain, P-Chain, and X-Chain divide work.",
  },
  {
    id: "l1-what",
    moduleId: "l1-lessons",
    title: "What an Avalanche L1 is",
    optional: false,
    reference: REF.l1s,
    body: "An Avalanche L1 is an independent blockchain with its own virtual machine, fee token, and validator set. It is not a smart contract parked on the C-Chain.\n\nTeams launch an L1 when they need custom execution, gas rules, or sovereignty that do not belong on the shared C-Chain. A DeFi pool can often stay on C-Chain; a game world with custom fees often should not.\n\nBuilder Hub documents L1 creation and operations. Read those guides before treating a subnet blog post as current protocol truth.",
  },
  {
    id: "l1-validators",
    moduleId: "l1-lessons",
    title: "L1 validator sets",
    optional: false,
    reference: REF.validatorManager,
    body: "L1 validators also validate the Primary Network. That dual role is what lets ICM carry validator-signed messages from one L1 to another with Avalanche’s shared security assumptions.\n\nSovereignty means the L1 controls its own execution and membership rules. It does not mean the L1 is isolated from Avalanche messaging or from Primary Network validation duties.\n\nValidator Manager contracts are how many modern L1s express membership on-chain. When docs mention manager contracts, they are talking about who may validate — not about C-Chain gas tokens.",
  },
  {
    id: "l1-custom",
    moduleId: "l1-lessons",
    title: "Custom execution and fees",
    optional: false,
    reference: REF.l1Create,
    body: "An L1 can run an EVM, a custom VM, or another execution environment. It can charge fees in its own token and define its own upgrade path.\n\nChoose an L1 when product rules need their own chain. Stay on C-Chain when a standard EVM contract and shared liquidity are enough. Wrong choice usually shows up as operational cost, not as a clever optimization.\n\nAvalanche CLI and Builder Hub tooling walk through creating an L1. Use official tooling notes for genesis and validator setup instead of copying outdated subnet recipes.",
  },
  {
    id: "cchain-evm",
    moduleId: "cchain-lessons",
    title: "C-Chain is an EVM",
    optional: false,
    reference: REF.coreth,
    body: "The C-Chain is Avalanche’s Ethereum-compatible contract chain. Solidity, standard wallets, Hardhat/Foundry-style workflows, and EVM explorers work here once you point them at Avalanche network settings.\n\nUnder the hood, Coreth adapts the EVM to Avalanche consensus and networking. You still write familiar contracts; you do not get to ignore Avalanche chain IDs and RPCs.\n\nFuji C-Chain is the test environment Forjora uses for its credential contract. Practice deploys and mints there before you ever touch Mainnet issuance — and Forjora itself does not issue credentials on C-Chain Mainnet today.",
  },
  {
    id: "cchain-gas",
    moduleId: "cchain-lessons",
    title: "Gas is paid in AVAX",
    optional: false,
    reference: REF.cChain,
    body: "C-Chain gas is paid in AVAX, not ETH. Chain ID 43113 is Fuji; 43114 is Avalanche C-Chain Mainnet. Mixing those IDs is a common wallet failure mode.\n\nA wallet that is still on Ethereum Mainnet cannot mint a Forjora credential. The app gates that step until you are on Fuji, because the live contract address only exists there for this product.\n\nWhen gas feels “wrong,” check network, asset, and RPC before debugging Solidity. Most learner mint failures are network selection, not contract logic.",
  },
  {
    id: "cchain-contracts",
    moduleId: "cchain-lessons",
    title: "Contracts and soulbound records",
    optional: false,
    reference: REF.cChain,
    body: "The Forjora credential is a soulbound NFT on the SkillForgeCredential contract — that Solidity name is the live Fuji identity. It stores a claimed score snapshot and puzzle mask. A later owner signature can mint an issuer-attested record instead.\n\nMinting from the learner UI is always Forjora claimed. The token cannot be transferred. Looking the record up proves it exists on Fuji; it does not turn a claimed score into an issuer assessment.\n\nExplorer links and metadata artwork are presence and presentation. They are not certification language, and Forjora does not issue this credential on Avalanche C-Chain Mainnet today.",
  },
  {
    id: "icm-what",
    moduleId: "icm-lessons",
    title: "Interchain Messaging",
    optional: false,
    reference: REF.icm,
    body: "Avalanche Interchain Messaging lets one chain send an authentic message to another. The message is backed by validator signatures over Warp primitives, not by a centralized relayer’s promise to be honest.\n\nThat is the messaging layer behind cross-L1 applications on Avalanche: state on chain A can authorize action on chain B without merging the two ledgers into one.\n\nICM is not a database sync tool. It is an authenticity and delivery layer for cross-chain application messages.",
  },
  {
    id: "icm-teleporter",
    moduleId: "icm-lessons",
    title: "Teleporter and Warp",
    optional: false,
    reference: REF.icmContracts,
    body: "Warp messaging is the low-level protocol. Teleporter (ICM contracts such as TeleporterMessenger) is the developer-facing contract layer applications use to send and receive those messages.\n\nYou will see Warp, AWM, ICM, and Teleporter in Avalanche docs. Treat Warp as the primitive and Teleporter as the production-ready interface that handles formatting, delivery tracking, and retries.\n\nOfficial ICM contract docs warn that TeleporterMessenger is meant to share a deterministic address across chains. Copying a random deploy command can break that assumption — follow Builder Hub deploy guidance.",
  },
  {
    id: "icm-use",
    moduleId: "icm-lessons",
    title: "When to use ICM",
    optional: false,
    reference: REF.icmContracts,
    body: "Use ICM when state on one L1 must be acted on by another L1 or by a Primary Network surface, and you need validator-backed authenticity for that message.\n\nDo not use it as a substitute for a local database, a cron job, or an ordinary C-Chain contract call on the same chain. Cross-chain messaging adds latency, fee, and failure modes you only want when the product needs them.\n\nThe Hard quiz includes ICM, L1, and C-Chain items together because production Avalanche builders meet all three in one system design.",
  },
  {
    id: "dev-tooling",
    moduleId: "dev-lessons",
    title: "Developer tooling",
    optional: false,
    reference: REF.tooling,
    body: "Avalanche developers typically combine an EVM toolchain with Avalanche-specific network config: chain IDs, RPC URLs, Fuji faucets, and CLI helpers for L1 and node work.\n\nBuilder Hub is the canonical place for current parameters. Unofficial blogs drift; faucet URLs and CLI flags change.\n\nBefore the Hard quiz, confirm you can name where to find official docs, how Fuji differs from Mainnet, and which chain an EVM deploy actually targets.",
  },
  {
    id: "dev-fuji",
    moduleId: "dev-lessons",
    title: "Practice on Fuji",
    optional: false,
    reference: REF.docs,
    body: "Fuji is where Forjora records claimed scores. Test AVAX has no Mainnet value. That is why the mint path validates Fuji chain ID explicitly and refuses to pretend Mainnet issuance is open.\n\nPractice wallet connect, network switch, and mint on Fuji until the flow is boring. Boring is the goal.\n\nNever treat a Fuji credential as a Mainnet diploma, an Avalanche Foundation certificate, or an issuer-attested assessment. Claimed remains claimed.",
  },
  {
    id: "dev-practice",
    moduleId: "dev-lessons",
    title: "Close the loop",
    optional: false,
    reference: REF.docs,
    body: "The Forjora loop is learn, challenge, earn, unlock, forge, then prove. Lessons unlock in order. Quiz points seat that quiz’s certificate pieces. Track certificates show progress per track.\n\nSeating all sixteen pieces reveals the path certificate for naming. A wallet is required only for the optional on-chain claim, which is always Forjora claimed from the learner UI.\n\nThe Hard quiz is the capstone assessment for this path. Retries replace that section’s points; they do not farm extra XP or leaderboard standing.",
  },
];

/** Lesson ids allowed as LESSON_COMPLETED progressEvent sourceIds (Firestore + client). */
export const LESSON_EVENT_SOURCE_IDS = Object.freeze(LESSONS.map((lesson) => lesson.id));

function indexById(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export const LEARNING_CATALOG = {
  version: LEARNING_CATALOG_VERSION,
  paths: LEARNING_PATHS,
  tracks: TRACKS,
  certificates: TRACK_CERTIFICATES,
  modules: MODULES,
  lessons: LESSONS,
  pathById: indexById(LEARNING_PATHS),
  trackById: indexById(TRACKS),
  moduleById: indexById(MODULES),
  lessonById: indexById(LESSONS),
  defaultPathId: LEARNING_PATHS[0].id,
};

export function getLearningCatalog() {
  return LEARNING_CATALOG;
}
