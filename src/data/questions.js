import { QUESTIONS_PER_QUIZ } from "../utils/quiz.js";

const REFS = {
  consensus: {
    title: "Snowman consensus",
    url: "https://build.avax.network/docs/primary-network/avalanche-consensus",
  },
  primary: {
    title: "Avalanche Primary Network",
    url: "https://build.avax.network/docs/primary-network",
  },
  cChain: {
    title: "C-Chain (Contract Chain)",
    url: "https://build.avax.network/docs/primary-network#c-chain-contract-chain",
  },
  pChain: {
    title: "P-Chain (Platform Chain)",
    url: "https://build.avax.network/docs/primary-network#p-chain-platform-chain",
  },
  xChain: {
    title: "X-Chain (Exchange Chain)",
    url: "https://build.avax.network/docs/primary-network#x-chain-exchange-chain",
  },
  l1s: {
    title: "Avalanche L1s",
    url: "https://build.avax.network/docs/avalanche-l1s",
  },
  icm: {
    title: "Interchain Messaging (ICM)",
    url: "https://build.avax.network/docs/cross-chain/avalanche-warp-messaging/overview",
  },
  nodes: {
    title: "Avalanche nodes and validators",
    url: "https://build.avax.network/docs/nodes",
  },
  avax: {
    title: "What is AVAX?",
    url: "https://www.avax.network/about/avalanche-avax",
  },
};

export const sections = [
  {
    id: "easy",
    name: "Easy",
    icon: "🟢",
    pointsPerQuestion: 3,
    timePerQuestion: 20,
    description: "Avalanche blockchain basics — consensus, subnets, and AVAX",
    questions: [
      {
        id: "e1",
        question: "What consensus mechanism does the Avalanche blockchain use?",
        options: ["Proof of Work", "Avalanche Consensus", "Delegated Proof of Stake", "Proof of Authority"],
        answer: "Avalanche Consensus",
        hint: "Think of small randomized polls among validators.",
        explanation:
          "Avalanche uses repeated random sampling among validators (the Snow family, including Snowman) instead of mining races or a single elected leader. That subsampling is why transactions can finalize in about a second without proof-of-work energy costs.",
        reference: REFS.consensus,
        funFact: "Avalanche Consensus combines ideas from classical and Nakamoto consensus for fast, irreversible finality.",
      },
      {
        id: "e2",
        question: "What is the native token of the Avalanche network?",
        options: ["ETH", "AVAX", "SOL", "MATIC"],
        answer: "AVAX",
        hint: "It's a three-letter ticker used for fees and staking.",
        explanation:
          "AVAX is the Primary Network's native asset. You pay transaction fees with it, stake it to validate, and use it as the economic unit that ties the C-Chain, P-Chain, and X-Chain together.",
        reference: REFS.avax,
        funFact: "AVAX is used for transaction fees, staking, and securing the network.",
      },
      {
        id: "e3",
        question: "How many primary blockchains make up the Avalanche Primary Network?",
        options: ["1", "2", "3", "5"],
        answer: "3",
        hint: "Count the chains that handle contracts, staking, and native assets.",
        explanation:
          "The Primary Network runs three chains: the C-Chain for EVM contracts, the P-Chain for validators and L1 coordination, and the X-Chain for Avalanche Native Token transfers. Together they are one special Avalanche L1.",
        reference: REFS.primary,
        funFact: "The Primary Network has X-Chain (assets), P-Chain (platform), and C-Chain (EVM smart contracts).",
      },
      {
        id: "e4",
        question: "Which chain on Avalanche is EVM-compatible for smart contracts?",
        options: ["X-Chain", "P-Chain", "C-Chain", "S-Chain"],
        answer: "C-Chain",
        hint: "It's the chain where you deploy Solidity contracts.",
        explanation:
          "The Contract Chain implements the Ethereum Virtual Machine, so Solidity contracts and Ethereum wallets work with Avalanche tooling. Fuji uses chain ID 43113; mainnet uses 43114.",
        reference: REFS.cChain,
        funFact: "The C-Chain lets you deploy Ethereum-compatible dApps with Avalanche speed.",
      },
      {
        id: "e5",
        question: "What are custom blockchains on Avalanche called?",
        options: ["Sidechains", "Subnets", "Rollups", "Shards"],
        answer: "Subnets",
        hint: "They let teams run their own validator sets and rules.",
        explanation:
          "A subnet is a dynamic validator set that can validate one or more blockchains with its own rules. Avalanche now describes those sovereign networks as L1s; the subnet is the validator group underneath.",
        reference: REFS.l1s,
        funFact: "Subnets are sovereign networks with their own validators and custom rules.",
      },
      {
        id: "e6",
        question: "What does ICM stand for in the Avalanche ecosystem?",
        options: [
          "Interchain Messaging",
          "Internal Chain Mining",
          "Instant Consensus Module",
          "Indexed Contract Market",
        ],
        answer: "Interchain Messaging",
        hint: "It is Avalanche's native cross-chain messaging layer.",
        explanation:
          "Interchain Messaging (ICM), also documented as Avalanche Warp Messaging, lets Avalanche L1s and the C-Chain exchange authenticated messages using validator BLS signatures instead of a separate trusted bridge for every app.",
        reference: REFS.icm,
        funFact: "ICM lets Avalanche L1s and the C-Chain exchange authenticated messages.",
      },
      {
        id: "e7",
        question: "An Avalanche L1 is best described as:",
        options: [
          "A sovereign blockchain with its own validators and rules",
          "A centralized database shard",
          "An Ethereum Layer 2 only",
          "A wallet plugin",
        ],
        answer: "A sovereign blockchain with its own validators and rules",
        hint: "These networks can customize gas tokens, VMs, and membership.",
        explanation:
          "An Avalanche L1 is a sovereign network: it sets its own membership, fees, virtual machine, and token economics. Performance is isolated from other L1s, so congestion on one chain does not set fees on another.",
        reference: REFS.l1s,
        funFact: "Avalanche L1s can customize gas tokens, VMs, and membership rules.",
      },
      {
        id: "e8",
        question: "Which Avalanche chain is primarily used for staking and network coordination?",
        options: ["X-Chain", "P-Chain", "C-Chain", "Q-Chain"],
        answer: "P-Chain",
        hint: "This chain registers validators and coordinates custom networks.",
        explanation:
          "The Platform Chain records staking, validator membership, and Avalanche L1 operations. Wallets that stake or add a validator interact with this chain, not the EVM contract chain.",
        reference: REFS.pChain,
        funFact: "The P-Chain tracks validators, staking, and subnet/L1 membership.",
      },
    ],
  },
  {
    id: "medium",
    name: "Medium",
    icon: "🟡",
    pointsPerQuestion: 5,
    timePerQuestion: 15,
    description: "Avalanche validators, staking, ICM, and L1 architecture",
    questions: [
      {
        id: "m1",
        question: "What is the minimum AVAX required to validate on the Primary Network?",
        options: ["100 AVAX", "500 AVAX", "2,000 AVAX", "32 AVAX"],
        answer: "2,000 AVAX",
        hint: "Primary Network validators lock a few thousand tokens.",
        explanation:
          "A Primary Network validator must stake at least 2,000 AVAX on the P-Chain for 14–365 days. That stake weights consensus sampling. Avalanche L1 validator slots use a separate monthly fee model.",
        reference: REFS.nodes,
        funFact: "Validators stake at least 2,000 AVAX and can accept delegations from others.",
      },
      {
        id: "m2",
        question: "Which Avalanche chain is used for creating and managing subnets?",
        options: ["X-Chain", "C-Chain", "P-Chain", "W-Chain"],
        answer: "P-Chain",
        hint: "Look for the chain that coordinates validators and custom networks.",
        explanation:
          "Subnet and L1 creation, validator additions, and staking transactions are platform-level operations on the P-Chain. The C-Chain runs contracts; the X-Chain moves native assets.",
        reference: REFS.pChain,
        funFact: "The Platform Chain coordinates validators and subnet creation.",
      },
      {
        id: "m3",
        question: "What does the X-Chain primarily handle within the Avalanche blockchain?",
        options: ["Smart contracts", "Asset transfers", "Validator staking", "Governance votes"],
        answer: "Asset transfers",
        hint: "It uses a UTXO model similar to Bitcoin for native tokens.",
        explanation:
          "The Exchange Chain issues and transfers Avalanche Native Tokens using a UTXO model. AVAX itself is one of those assets. Smart contracts live on the C-Chain; staking lives on the P-Chain.",
        reference: REFS.xChain,
        funFact: "The Exchange Chain uses the UTXO model for fast asset transfers.",
      },
      {
        id: "m4",
        question: "Avalanche subnet validators can:",
        options: [
          "Only validate one subnet",
          "Validate multiple subnets they choose",
          "Mine blocks with GPUs",
          "Run without staking",
        ],
        answer: "Validate multiple subnets they choose",
        hint: "Operators opt into the networks they want to secure.",
        explanation:
          "A node can validate several subnets or L1s it opts into, plus the chains those validator sets run. That sovereignty model lets operators skip networks they have no interest in, instead of validating every chain in the ecosystem.",
        reference: REFS.l1s,
        funFact: "Validators opt into subnets — flexible participation across the ecosystem.",
      },
      {
        id: "m5",
        question: "What is Avalanche's approximate time-to-finality?",
        options: ["12 minutes", "6 seconds", "Less than 2 seconds", "30 seconds"],
        answer: "Less than 2 seconds",
        hint: "Think sub-second or single-digit seconds finality.",
        explanation:
          "Snowman consensus finalizes blocks in about a second. Accepted transactions are irreversible, so you do not wait for extra confirmations the way you do in proof-of-work chains.",
        reference: REFS.consensus,
        funFact: "Sub-second finality makes Avalanche practical for DeFi and games.",
      },
      {
        id: "m6",
        question: "Why is ICM useful for Avalanche L1s?",
        options: [
          "It enables authenticated cross-chain messaging without bridges for every app",
          "It replaces AVAX as the gas token",
          "It removes the need for validators",
          "It only works offline",
        ],
        answer: "It enables authenticated cross-chain messaging without bridges for every app",
        hint: "Native messaging across Avalanche networks.",
        explanation:
          "ICM uses BLS signatures from an L1's validator set so another chain can verify a message without a custodial bridge. Apps still need relayers, but they do not invent a new trusted messenger for each pair of chains.",
        reference: REFS.icm,
        funFact: "ICM reduces custom bridge complexity for Avalanche-native interoperability.",
      },
      {
        id: "m7",
        question: "Compared with a generic sidechain, an Avalanche L1 emphasizes:",
        options: [
          "Custom validator sets and sovereign execution environments",
          "Shared global mempools only",
          "Proof-of-work mining pools",
          "Centralized sequencers only",
        ],
        answer: "Custom validator sets and sovereign execution environments",
        hint: "Sovereignty and custom membership.",
        explanation:
          "Each L1 chooses its validators, virtual machine, fees, and access rules. Workloads stay isolated, so a busy NFT mint on the C-Chain does not raise gas on an independent L1.",
        reference: REFS.l1s,
        funFact: "Teams can tailor L1 economics and virtual machines to their application.",
      },
      {
        id: "m8",
        question: "Delegators on Avalanche primarily do what?",
        options: [
          "Stake AVAX with validators to help secure the network",
          "Write Solidity compilers",
          "Operate the X-Chain alone",
          "Mint unlimited AVAX",
        ],
        answer: "Stake AVAX with validators to help secure the network",
        hint: "This role supports validators without running a node.",
        explanation:
          "Delegators lock AVAX with a chosen validator on the P-Chain. They share staking rewards without operating consensus hardware. The validator still has to stay online and correct for both parties to earn.",
        reference: REFS.nodes,
        funFact: "Delegators earn rewards by staking with validators without running a node.",
      },
    ],
  },
  {
    id: "hard",
    name: "Hard",
    icon: "🔴",
    pointsPerQuestion: 8,
    timePerQuestion: 12,
    description: "Advanced Avalanche — Snow protocols, VMs, ICM, and tokenomics",
    questions: [
      {
        id: "h1",
        question: "The Avalanche blockchain consensus protocol family is collectively known as:",
        options: ["Snow Family", "BFT Family", "Ghost Protocol", "Casper FFG"],
        answer: "Snow Family",
        hint: "Protocol names include Snowflake, Snowball, and Slush.",
        explanation:
          "Slush, Snowflake, Snowball, and Snowman are the Snow protocols. Repeated random sampling drives a metastable preference until the network decides. Snowman is the linear-chain variant used on the Primary Network.",
        reference: REFS.consensus,
        funFact: "Snowball, Snowflake, and Slush protocols form the Snow family of consensus.",
      },
      {
        id: "h2",
        question: "What VM does the Avalanche C-Chain use?",
        options: ["Move VM", "EVM", "WASM VM", "SVM"],
        answer: "EVM",
        hint: "It's compatible with Solidity and Ethereum tooling.",
        explanation:
          "The C-Chain runs Coreth, an Ethereum Virtual Machine implementation. Solidity, Hardhat, and MetaMask work with chain IDs 43114 (mainnet) and 43113 (Fuji). Other VMs can run on custom L1s.",
        reference: REFS.cChain,
        funFact: "Full EVM compatibility means Solidity contracts deploy with minimal changes.",
      },
      {
        id: "h3",
        question: "What is the max supply of AVAX?",
        options: ["100 million", "360 million", "720 million", "Unlimited"],
        answer: "720 million",
        hint: "The cap is under one billion tokens.",
        explanation:
          "AVAX has a hard cap of 720 million tokens. Transaction fees are burned rather than paid to miners, so circulating supply can fall as the network is used, while the maximum remaining cap stays fixed.",
        reference: REFS.avax,
        funFact: "AVAX has a capped supply — all tokens were created at genesis, with no open-ended minting.",
      },
      {
        id: "h4",
        question: "Subnet validators must also validate which network?",
        options: ["Bitcoin", "Primary Network", "Ethereum", "No requirement"],
        answer: "Primary Network",
        hint: "Classic subnet operators also secure Avalanche's shared three-chain network.",
        explanation:
          "In the original subnet model, a node that validated a subnet also had to validate the Primary Network (X, P, and C). That tied extra chains to Avalanche's shared validator set. Sovereign L1s can now set more independent validator rules, but they still rely on P-Chain registry data.",
        reference: REFS.l1s,
        funFact: "Classic subnet validators also validated the Avalanche Primary Network.",
      },
      {
        id: "h5",
        question: "Which fee mechanism on Avalanche burns transaction fees?",
        options: ["EIP-1559 only", "Dynamic fee burning", "No burning", "Manual burns"],
        answer: "Dynamic fee burning",
        hint: "Fees are destroyed as part of transactions, not paid out as miner rewards.",
        explanation:
          "AVAX transaction fees are burned. On the C-Chain that follows a dynamic base-fee model; burning reduces circulating supply as activity rises instead of transferring those fees to a miner set.",
        reference: REFS.avax,
        funFact: "Burned AVAX fees reduce circulating supply as network usage grows.",
      },
      {
        id: "h6",
        question: "Which statement about Avalanche ICM is most accurate?",
        options: [
          "It provides native message delivery between Avalanche chains/L1s",
          "It is only a wallet UI theme",
          "It replaces the need for AVAX entirely",
          "It is a Bitcoin ordinals standard",
        ],
        answer: "It provides native message delivery between Avalanche chains/L1s",
        hint: "Think authenticated messages between Avalanche networks.",
        explanation:
          "ICM is a native messaging primitive: validators of the source chain sign a payload, and the destination chain verifies that aggregated signature against the known validator set. It is interoperability, not a gas-token replacement.",
        reference: REFS.icm,
        funFact: "ICM is designed for Avalanche-native interoperability and composability.",
      },
      {
        id: "h7",
        question: "A major benefit of Avalanche L1s for application teams is:",
        options: [
          "Application-specific performance, fees, and membership control",
          "Forced use of a single global gas market only",
          "Elimination of cryptography",
          "Automatic mainnet AVAX minting",
        ],
        answer: "Application-specific performance, fees, and membership control",
        hint: "Customization for app needs.",
        explanation:
          "Teams can pick a gas token, hardware rules, allow-lists, and throughput targets that the shared C-Chain cannot change for one app. Isolation also keeps another project's traffic from pricing you out.",
        reference: REFS.l1s,
        funFact: "L1s let teams optimize for games, DeFi, RWAs, or enterprise constraints.",
      },
      {
        id: "h8",
        question: "In Avalanche consensus sampling, validators repeatedly query:",
        options: [
          "Small random subsets of other validators",
          "Only the largest mining pool",
          "A single elected leader forever",
          "Off-chain social media polls",
        ],
        answer: "Small random subsets of other validators",
        hint: "Repeated randomized sampling.",
        explanation:
          "Each validator asks a small stake-weighted sample (parameter k, typically 20) for their preference and repeats until a quorum holds for enough rounds. Message cost stays nearly constant as the validator set grows.",
        reference: REFS.consensus,
        funFact: "Repeated sampling drives metastable decisions toward irreversible finality.",
      },
    ],
  },
];

export const PUZZLE_SIZE = 4;
export const PIECE_COST = 5;
export const TOTAL_PIECES = PUZZLE_SIZE * PUZZLE_SIZE;

export const PUZZLE_LABELS = [
  "⛓️", "🔺", "❄️", "⚡",
  "🏔️", "🔐", "💎", "🌐",
  "📡", "🛡️", "🔥", "✨",
  "🎯", "🚀", "🏆", "🎓",
];

export function getSectionById(id) {
  return sections.find((s) => s.id === id);
}

export const MAX_POINTS = sections.reduce(
  (sum, s) => sum + s.pointsPerQuestion * QUESTIONS_PER_QUIZ,
  0
);
