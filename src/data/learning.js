/**
 * Data-driven Avalanche learning catalog.
 * UI should read this file instead of hardcoding track or path rules.
 */

export const LEARNING_CATALOG_VERSION = 1;

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
  cChain: {
    title: "C-Chain (Contract Chain)",
    url: "https://build.avax.network/docs/primary-network#c-chain-contract-chain",
  },
  icm: {
    title: "Interchain Messaging",
    url: "https://build.avax.network/docs/cross-chain/avalanche-warp-messaging/overview",
  },
  nodes: { title: "Nodes and validators", url: "https://build.avax.network/docs/nodes" },
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
    body: "Avalanche is a proof-of-stake network designed for fast, irreversible finality. The Primary Network is the shared security and messaging layer that other Avalanche chains connect to.\n\nForjora uses this track to ground later L1, C-Chain, and ICM lessons. Completing the Easy quiz records a claimed score for fundamentals — it is not an issuer-attested credential.",
  },
  {
    id: "fund-chains",
    moduleId: "fund-lessons",
    title: "The three Primary Network chains",
    optional: false,
    reference: REF.primary,
    body: "The Primary Network has three chains. The C-Chain runs the Ethereum Virtual Machine. The P-Chain coordinates validators and L1s. The X-Chain handles native asset creation and exchange.\n\nYou do not pick one chain and ignore the others. Fees, staking, and cross-chain messages all depend on how these three chains work together.",
  },
  {
    id: "fund-avax",
    moduleId: "fund-lessons",
    title: "AVAX, fees, and staking",
    optional: false,
    reference: REF.avax,
    body: "AVAX is the native asset. You pay C-Chain gas with it, stake it to validate, and use it as the unit of account across the Primary Network.\n\nFuji is the public test network. Forjora mints its learning record on Fuji so you can practice without Mainnet funds.",
  },
  {
    id: "arch-primary",
    moduleId: "arch-lessons",
    title: "Primary Network architecture",
    optional: false,
    reference: REF.primary,
    body: "Every Avalanche L1 validator also validates the Primary Network. That shared validator set is how Avalanche can pass authentic messages between chains without a trusted relay.\n\nWhen you later study L1s, remember they are sovereign execution environments that still sit in this architecture.",
  },
  {
    id: "arch-consensus",
    moduleId: "arch-lessons",
    title: "Snowman consensus",
    optional: false,
    reference: REF.consensus,
    body: "Snowman is the linear-chain member of the Snow family. Validators sample small random subsets instead of running a classical all-to-all BFT round.\n\nThat sampling is why finality is fast and irreversible once a transaction is accepted. Forjora quizzes treat Snowman as required vocabulary.",
  },
  {
    id: "arch-validators",
    moduleId: "arch-lessons",
    title: "Validators and staking",
    optional: false,
    reference: REF.nodes,
    body: "Validators stake AVAX and participate in consensus. The P-Chain tracks the validator set. Nodes that do not stake can still read the network as full nodes or RPC providers.\n\nThe Medium quiz checks this architecture, including how C-Chain, P-Chain, and X-Chain divide work.",
  },
  {
    id: "l1-what",
    moduleId: "l1-lessons",
    title: "What an Avalanche L1 is",
    optional: false,
    reference: REF.l1s,
    body: "An Avalanche L1 is an independent blockchain with its own virtual machine, fee token, and validator set. It is not a smart contract on the C-Chain.\n\nTeams launch an L1 when they need custom execution or gas rules that do not belong on the shared C-Chain.",
  },
  {
    id: "l1-validators",
    moduleId: "l1-lessons",
    title: "L1 validator sets",
    optional: false,
    reference: REF.l1s,
    body: "L1 validators also validate the Primary Network. That dual role lets ICM carry validator-signed messages from one L1 to another.\n\nSovereignty here means the L1 controls its own execution. It does not mean the L1 is isolated from Avalanche messaging.",
  },
  {
    id: "l1-custom",
    moduleId: "l1-lessons",
    title: "Custom execution and fees",
    optional: false,
    reference: REF.l1s,
    body: "An L1 can run an EVM, a custom VM, or another execution environment. It can charge fees in its own token.\n\nChoose an L1 when product rules need their own chain. Stay on C-Chain when a standard EVM contract is enough.",
  },
  {
    id: "cchain-evm",
    moduleId: "cchain-lessons",
    title: "C-Chain is an EVM",
    optional: false,
    reference: REF.cChain,
    body: "The C-Chain is Avalanche’s Ethereum-compatible contract chain. Solidity, standard wallets, and EVM tooling work here with Avalanche-specific network settings.\n\nFuji C-Chain is the test environment Forjora uses for its credential contract.",
  },
  {
    id: "cchain-gas",
    moduleId: "cchain-lessons",
    title: "Gas is paid in AVAX",
    optional: false,
    reference: REF.cChain,
    body: "C-Chain gas is paid in AVAX, not ETH. Chain ID 43113 is Fuji; 43114 is Mainnet.\n\nA wallet that is still on Ethereum Mainnet cannot mint a Forjora credential. The app gates that step until you are on Fuji.",
  },
  {
    id: "cchain-contracts",
    moduleId: "cchain-lessons",
    title: "Contracts and soulbound records",
    optional: false,
    reference: REF.cChain,
    body: "The Forjora credential is a soulbound NFT on the SkillForgeCredential contract (the live Fuji name). It stores a claimed score and puzzle mask. A later owner signature can attest that record.\n\nMinting from the learner UI is always Forjora claimed. Lookup can prove the on-chain record exists; it cannot turn a claimed score into an issuer assessment.",
  },
  {
    id: "icm-what",
    moduleId: "icm-lessons",
    title: "Interchain Messaging",
    optional: false,
    reference: REF.icm,
    body: "Avalanche ICM lets one chain send an authentic message to another. The message is backed by validator signatures, not by a centralized relayer’s honesty.\n\nThis is the messaging layer behind cross-L1 applications on Avalanche.",
  },
  {
    id: "icm-teleporter",
    moduleId: "icm-lessons",
    title: "Teleporter and Warp",
    optional: false,
    reference: REF.icm,
    body: "Warp messaging is the protocol. Teleporter is the contract layer applications use to send and receive those messages.\n\nYou will see both names in Avalanche docs. Treat Warp as the primitive and Teleporter as the developer interface.",
  },
  {
    id: "icm-use",
    moduleId: "icm-lessons",
    title: "When to use ICM",
    optional: false,
    reference: REF.icm,
    body: "Use ICM when state on one L1 must be acted on by another L1 or by the Primary Network. Do not use it as a substitute for a local database.\n\nThe Hard quiz includes ICM, L1, and C-Chain items together because developers meet all three in production.",
  },
  {
    id: "dev-tooling",
    moduleId: "dev-lessons",
    title: "Developer tooling",
    optional: false,
    reference: REF.docs,
    body: "Avalanche developers typically combine an EVM toolchain with Avalanche network config: chain IDs, RPC URLs, and Fuji faucets.\n\nRead official Builder Hub docs before copying chain settings from a random blog.",
  },
  {
    id: "dev-fuji",
    moduleId: "dev-lessons",
    title: "Practice on Fuji",
    optional: false,
    reference: REF.docs,
    body: "Fuji is where Forjora records claimed scores. Test AVAX has no Mainnet value. That is why the mint path is explicit about Fuji chain ID validation.\n\nNever treat a Fuji credential as a Mainnet or issuer-attested diploma.",
  },
  {
    id: "dev-practice",
    moduleId: "dev-lessons",
    title: "Close the loop",
    optional: false,
    reference: REF.docs,
    body: "The Forjora loop is learn, challenge, earn, unlock, forge, then prove. Points buy puzzle pieces. The finished jigsaw reveals a certificate. A wallet is required only for the on-chain claim.\n\nThe Hard quiz is the capstone assessment for this path. Retries replace that section’s points; they do not farm extra XP.",
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
