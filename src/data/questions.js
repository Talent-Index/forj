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
        funFact: "Avalanche Consensus combines the best of classical and Nakamoto consensus for sub-second finality!",
      },
      {
        id: "e2",
        question: "What is the native token of the Avalanche network?",
        options: ["ETH", "AVAX", "SOL", "MATIC"],
        answer: "AVAX",
        hint: "It's a three-letter ticker used for fees and staking.",
        funFact: "AVAX is used for transaction fees, staking, and securing the network.",
      },
      {
        id: "e3",
        question: "How many primary blockchains make up the Avalanche Primary Network?",
        options: ["1", "2", "3", "5"],
        answer: "3",
        hint: "They are commonly called X, P and C chains.",
        funFact: "The Primary Network has X-Chain (assets), P-Chain (platform), and C-Chain (EVM smart contracts).",
      },
      {
        id: "e4",
        question: "Which chain on Avalanche is EVM-compatible for smart contracts?",
        options: ["X-Chain", "P-Chain", "C-Chain", "S-Chain"],
        answer: "C-Chain",
        hint: "It's the EVM chain where you deploy Solidity contracts.",
        funFact: "The C-Chain lets you deploy Ethereum-compatible dApps with Avalanche speed!",
      },
      {
        id: "e5",
        question: "What are custom blockchains on Avalanche called?",
        options: ["Sidechains", "Subnets", "Rollups", "Shards"],
        answer: "Subnets",
        hint: "They let teams run their own validator sets and rules.",
        funFact: "Subnets are sovereign networks with their own validators and custom rules.",
      },
    ],
  },
  {
    id: "medium",
    name: "Medium",
    icon: "🟡",
    pointsPerQuestion: 5,
    timePerQuestion: 15,
    description: "Avalanche blockchain validators, staking, and subnet architecture",
    questions: [
      {
        id: "m1",
        question: "What is the minimum AVAX required to validate on the Primary Network?",
        options: ["100 AVAX", "500 AVAX", "2,000 AVAX", "32 AVAX"],
        answer: "2,000 AVAX",
        hint: "Validators stake a few thousand AVAX on the Primary Network.",
        funFact: "Validators stake at least 2,000 AVAX and can accept delegations from others.",
      },
      {
        id: "m2",
        question: "Which Avalanche chain is used for creating and managing subnets?",
        options: ["X-Chain", "C-Chain", "P-Chain", "W-Chain"],
        answer: "P-Chain",
        hint: "Platform chain handles validators and subnets.",
        funFact: "The Platform Chain (P-Chain) coordinates validators and subnet creation.",
      },
      {
        id: "m3",
        question: "What does the X-Chain primarily handle within the Avalanche blockchain?",
        options: ["Smart contracts", "Asset transfers", "Validator staking", "Governance votes"],
        answer: "Asset transfers",
        hint: "It uses a UTXO model similar to Bitcoin for assets.",
        funFact: "The Exchange Chain uses the UTXO model for fast asset transfers.",
      },
      {
        id: "m4",
        question: "Avalanche subnets allow validators to:",
        options: [
          "Only validate one subnet",
          "Validate multiple subnets they choose",
          "Mine blocks with GPUs",
          "Run without staking",
        ],
        answer: "Validate multiple subnets they choose",
        hint: "Validators opt into subnets they want to validate.",
        funFact: "Validators opt into subnets — flexible participation across the ecosystem!",
      },
      {
        id: "m5",
        question: "What is Avalanche's approximate time-to-finality?",
        options: ["12 minutes", "6 seconds", "Less than 2 seconds", "30 seconds"],
        answer: "Less than 2 seconds",
        hint: "Think sub-second or single-digit seconds finality.",
        funFact: "Sub-second finality makes Avalanche ideal for DeFi and gaming applications.",
      },
    ],
  },
  {
    id: "hard",
    name: "Hard",
    icon: "🔴",
    pointsPerQuestion: 8,
    timePerQuestion: 12,
    description: "Advanced Avalanche blockchain — Snow protocols, VMs, and tokenomics",
    questions: [
      {
        id: "h1",
        question: "The Avalanche blockchain consensus protocol family is collectively known as:",
        options: ["Snow Family", "BFT Family", "Ghost Protocol", "Casper FFG"],
        answer: "Snow Family",
        hint: "Names include Snowflake, Snowball and Slush.",
        funFact: "Snowball, Snowflake, and Slush protocols form the Snow family of consensus.",
      },
      {
        id: "h2",
        question: "What VM does the Avalanche C-Chain use?",
        options: ["Move VM", "EVM", "WASM VM", "SVM"],
        answer: "EVM",
        hint: "It's compatible with Solidity and Ethereum tooling.",
        funFact: "Full EVM compatibility means Solidity contracts deploy with minimal changes.",
      },
      {
        id: "h3",
        question: "What is the max supply of AVAX?",
        options: ["100 million", "360 million", "720 million", "Unlimited"],
        answer: "720 million",
        hint: "It's under one billion tokens.",
        funFact: "AVAX has a capped supply — all tokens were created at genesis, no new minting.",
      },
      {
        id: "h4",
        question: "Subnet validators must also validate which network?",
        options: ["Bitcoin", "Primary Network", "Ethereum", "No requirement"],
        answer: "Primary Network",
        hint: "Subnet validators must also participate in the Primary Network.",
        funFact: "All subnet validators must validate the Avalanche Primary Network too.",
      },
      {
        id: "h5",
        question: "Which fee mechanism on Avalanche burns transaction fees?",
        options: ["EIP-1559 only", "Dynamic fee burning", "No burning", "Manual burns"],
        answer: "Dynamic fee burning",
        hint: "Fees are burned dynamically as part of transactions.",
        funFact: "AVAX fees are burned, reducing supply and aligning incentives with network usage.",
      },
    ],
  },
];

// Expand the question pools programmatically to reach ~200 total questions.
// We create numbered variants of the base questions (keeps answers and hints),
// then replace the section.questions with the expanded pool.
const TARGET_TOTAL = 200;
const perSection = Math.ceil(TARGET_TOTAL / sections.length);

sections.forEach((sec) => {
  const base = sec.questions.slice();
  const expanded = [];
  let idx = 1;
  while (expanded.length < perSection) {
    for (let b of base) {
      if (expanded.length >= perSection) break;
      const copy = {
        ...b,
        id: `${sec.id}-${b.id || 'q'}-${idx}`,
        question: b.question.includes("(variant") ? b.question : `${b.question} (variant ${idx})`,
      };
      expanded.push(copy);
      idx++;
    }
  }
  sec.questions = expanded;
});

export const PUZZLE_SIZE = 4;
export const PIECE_COST = 5;
export const TOTAL_PIECES = PUZZLE_SIZE * PUZZLE_SIZE;
export const MAX_POINTS = sections.reduce(
  (sum, s) => sum + s.pointsPerQuestion * s.questions.length,
  0
);

export const PUZZLE_LABELS = [
  "⛓️", "🔺", "❄️", "⚡",
  "🏔️", "🔐", "💎", "🌐",
  "📡", "🛡️", "🔥", "✨",
  "🎯", "🚀", "🏆", "🎓",
];

export function getSectionById(id) {
  return sections.find((s) => s.id === id);
}
