import { QUESTIONS_PER_QUIZ } from "../utils/quiz.js";

export const QUESTION_TOPICS = [
  "fundamentals",
  "c-chain",
  "evm",
  "l1s",
  "icm",
  "validators",
  "consensus",
  "tooling",
  "ecosystem",
];

const REFS = {
  consensus: {
    title: "Snowman consensus",
    url: "https://build.avax.network/docs/primary-network/avalanche-consensus",
  },
  primary: {
    title: "Avalanche Primary Network",
    url: "https://build.avax.network/docs/primary-network",
  },
  docsHub: {
    title: "Avalanche Builder Hub docs",
    url: "https://build.avax.network/docs",
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
  icmContracts: {
    title: "ICM contracts (Teleporter)",
    url: "https://build.avax.network/docs/cross-chain/icm-contracts/overview",
  },
  nodes: {
    title: "Avalanche nodes and validators",
    url: "https://build.avax.network/docs/nodes",
  },
  avax: {
    title: "What is AVAX?",
    url: "https://www.avax.network/about/avalanche-avax",
  },
  coreth: {
    title: "Coreth architecture",
    url: "https://build.avax.network/docs/primary-network/coreth-architecture",
  },
  platformCli: {
    title: "Platform CLI",
    url: "https://build.avax.network/docs/tooling/platform-cli",
  },
  validatorManager: {
    title: "Validator Manager contracts",
    url: "https://build.avax.network/docs/avalanche-l1s/validator-manager/contract",
  },
  createL1: {
    title: "Create an Avalanche L1",
    url: "https://build.avax.network/docs/tooling/avalanche-cli/create-avalanche-l1",
  },
};

export const sections = [
  {
    id: "easy",
    name: "Easy",
    icon: "🟢",
    pointsPerQuestion: 3,
    timePerQuestion: 20,
    description: "Avalanche fundamentals — C-Chain, L1s, ICM, validators, and Fuji",
    questions: [
      {
        id: "e1",
        topic: "consensus",
        question: "What consensus protocol does the Avalanche Primary Network use?",
        options: ["Proof of Work", "Snowman Consensus", "Practical Byzantine Fault Tolerance", "Proof of Authority"],
        answer: "Snowman Consensus",
        hint: "Think of small randomized polls among validators.",
        explanation:
          "The Primary Network uses Snowman, the linear-chain member of the Snow family. Validators repeatedly sample a small random subset instead of mining or running a classical all-to-all BFT round. That is why acceptance is fast and irreversible.",
        reference: REFS.consensus,
        funFact: "Snowman combines ideas from classical and Nakamoto consensus for fast, irreversible finality.",
      },
      {
        id: "e2",
        topic: "fundamentals",
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
        topic: "fundamentals",
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
        topic: "c-chain",
        question: "Which chain on Avalanche is EVM-compatible for smart contracts?",
        options: ["X-Chain", "P-Chain", "C-Chain", "Beacon Chain"],
        answer: "C-Chain",
        hint: "It's the chain where you deploy Solidity contracts.",
        explanation:
          "The Contract Chain implements the Ethereum Virtual Machine, so Solidity contracts and Ethereum wallets work with Avalanche tooling. Fuji uses chain ID 43113; mainnet uses 43114.",
        reference: REFS.cChain,
        funFact: "The C-Chain lets you deploy Ethereum-compatible dApps with Avalanche speed.",
      },
      {
        id: "e5",
        topic: "l1s",
        question: "Sovereign application-specific blockchains on Avalanche are called:",
        options: ["Sidechains", "Avalanche L1s", "Rollups", "Shards"],
        answer: "Avalanche L1s",
        hint: "Current docs use this name for networks that used to be described mainly as subnets.",
        explanation:
          "Avalanche L1s are sovereign networks with their own validators, fees, and virtual machines. A subnet is the validator set underneath; the L1 is the blockchain those validators secure. Isolation means congestion on one L1 does not set fees on another.",
        reference: REFS.l1s,
        funFact: "Avalanche L1s can customize gas tokens, VMs, and membership rules.",
      },
      {
        id: "e6",
        topic: "icm",
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
        topic: "l1s",
        question: "If the shared C-Chain is congested, an independent Avalanche L1 typically:",
        options: [
          "Keeps its own fees and throughput",
          "Must match C-Chain gas prices",
          "Halts until the C-Chain is quiet",
          "Settles its blocks on Ethereum instead",
        ],
        answer: "Keeps its own fees and throughput",
        hint: "Workloads on separate validator sets do not share a fee market.",
        explanation:
          "Each Avalanche L1 has isolated execution, fees, and membership. A busy NFT mint on the C-Chain does not set gas on another L1. That isolation is a main reason teams launch their own L1 instead of staying only on the C-Chain.",
        reference: REFS.l1s,
        funFact: "One L1 can also host multiple blockchains validated by the same subnet.",
      },
      {
        id: "e8",
        topic: "validators",
        question: "Which Avalanche chain is primarily used for staking and network coordination?",
        options: ["X-Chain", "P-Chain", "C-Chain", "Beacon Chain"],
        answer: "P-Chain",
        hint: "This chain registers validators and coordinates custom networks.",
        explanation:
          "The Platform Chain records staking, validator membership, and Avalanche L1 operations. Wallets that stake or add a validator interact with this chain, not the EVM contract chain.",
        reference: REFS.pChain,
        funFact: "The P-Chain tracks validators, staking, and subnet/L1 membership.",
      },
      {
        id: "e9",
        topic: "ecosystem",
        question: "What is Avalanche Fuji?",
        options: [
          "Avalanche's public testnet",
          "Avalanche's proof-of-work mainnet",
          "An Ethereum testnet that settles to mainnet",
          "A deprecated name for the P-Chain",
        ],
        answer: "Avalanche's public testnet",
        hint: "Forjora mints credentials here using valueless test tokens.",
        explanation:
          "Fuji is Avalanche's public test network. The C-Chain ID is 43113. Test AVAX has no market value and is used for gas while you learn, deploy, and mint test credentials.",
        reference: REFS.primary,
        funFact: "Fuji C-Chain ID is 43113; Avalanche mainnet C-Chain ID is 43114.",
      },
      {
        id: "e10",
        topic: "evm",
        question: "Why can MetaMask and Solidity tools work with the Avalanche C-Chain?",
        options: [
          "Because the C-Chain is EVM-compatible",
          "Because Avalanche is an Ethereum Layer 2",
          "Because it only accepts Solana programs",
          "Because it rejects Ethereum JSON-RPC",
        ],
        answer: "Because the C-Chain is EVM-compatible",
        hint: "The same contract language and wallet RPCs used on Ethereum apply here.",
        explanation:
          "The C-Chain implements the Ethereum Virtual Machine and Geth-style JSON-RPC. You can point Hardhat, Foundry, Remix, and MetaMask at Fuji or mainnet and deploy Solidity with the correct chain ID.",
        reference: REFS.cChain,
        funFact: "Add Fuji as chain ID 43113 and mainnet as 43114 in an EVM wallet.",
      },
      {
        id: "e11",
        topic: "validators",
        question: "To help secure the Avalanche Primary Network as a validator, a node must:",
        options: [
          "Stake AVAX on the P-Chain",
          "Mine blocks with GPUs",
          "Run an Ethereum beacon node with 32 ETH",
          "Validate with zero stake as a light client",
        ],
        answer: "Stake AVAX on the P-Chain",
        hint: "Influence in consensus is bonded with the native token.",
        explanation:
          "Primary Network validators bond AVAX on the P-Chain. Stake weight affects how often other nodes sample you in consensus. Mainnet requires 2,000 AVAX; Fuji uses a much smaller test stake.",
        reference: REFS.nodes,
        funFact: "You can also delegate AVAX to a validator without running a node.",
      },
      {
        id: "e12",
        topic: "consensus",
        question: "After an Avalanche transaction is accepted, it is typically:",
        options: [
          "Final in about a second and not reversible",
          "Reorged for an hour like proof-of-work",
          "Pending until a weekly governance vote",
          "Valid only inside one wallet app",
        ],
        answer: "Final in about a second and not reversible",
        hint: "Think sub-second or about-one-second settlement.",
        explanation:
          "Snowman acceptance is irreversible. You do not wait for extra 'confirmations' the way you do on proof-of-work chains. That fast finality is why Avalanche is used for DeFi, games, and payments.",
        reference: REFS.consensus,
        funFact: "Official docs describe Snowman finality as sub-second and immutable.",
      },
      {
        id: "e13",
        topic: "c-chain",
        question: "What token pays gas fees on the Avalanche C-Chain?",
        options: ["AVAX", "ETH only", "BTC", "USDC as the only option"],
        answer: "AVAX",
        hint: "The Primary Network's native asset is the C-Chain gas token.",
        explanation:
          "C-Chain gas must be paid in AVAX. You can deploy ERC-20s on the C-Chain, but those tokens do not pay C-Chain fees. A custom Avalanche L1 can choose a different native gas token.",
        reference: REFS.cChain,
        funFact: "Forjora mint transactions on Fuji spend test AVAX for gas.",
      },
      {
        id: "e14",
        topic: "tooling",
        question: "Where do Avalanche builders find official docs, faucets, and L1 consoles?",
        options: [
          "Avalanche Builder Hub",
          "Snowtrace only",
          "The Ethereum Yellow Paper only",
          "Core wallet settings only",
        ],
        answer: "Avalanche Builder Hub",
        hint: "Look for the official build.avax.network site.",
        explanation:
          "Builder Hub (build.avax.network) hosts Primary Network docs, L1 guides, ICM references, the faucet, and developer consoles. Use it instead of unofficial blog copies when you need current parameters.",
        reference: REFS.docsHub,
        funFact: "Platform CLI is documented there for P-Chain staking and L1 validator operations.",
      },
      {
        id: "e15",
        topic: "ecosystem",
        question: "Which Primary Network chain is mainly for Avalanche Native Token transfers?",
        options: ["X-Chain", "C-Chain", "P-Chain", "Beacon Chain"],
        answer: "X-Chain",
        hint: "Think UTXO-style asset issuance, not Solidity.",
        explanation:
          "The Exchange Chain issues and transfers Avalanche Native Tokens, including AVAX, using a UTXO model. Smart contracts live on the C-Chain; staking lives on the P-Chain.",
        reference: REFS.xChain,
        funFact: "Wallets often hide X-Chain transfers behind a simple send UI.",
      },
      {
        id: "e16",
        topic: "evm",
        question: "The Avalanche C-Chain is best classified as:",
        options: [
          "An independent EVM chain, not an Ethereum Layer 2",
          "An Ethereum rollup that settles on Ethereum L1",
          "A Cosmos zone with no EVM",
          "A restaking module on Ethereum",
        ],
        answer: "An independent EVM chain, not an Ethereum Layer 2",
        hint: "EVM compatibility does not mean it settles on Ethereum.",
        explanation:
          "The C-Chain is Avalanche's own contract chain. It speaks the EVM so Ethereum tools work, but consensus, fees, and security are Avalanche's — it is not an Ethereum rollup or plasma chain.",
        reference: REFS.cChain,
        funFact: "You still pick chain ID 43114 (mainnet) or 43113 (Fuji), not Ethereum's 1.",
      },
    ],
  },
  {
    id: "medium",
    name: "Medium",
    icon: "🟡",
    pointsPerQuestion: 5,
    timePerQuestion: 15,
    description: "Validators, C-Chain IDs, Subnet-EVM, ICM, and L1 architecture",
    questions: [
      {
        id: "m1",
        topic: "validators",
        question: "What is the minimum AVAX required to validate on the Primary Network mainnet?",
        options: ["100 AVAX", "500 AVAX", "2,000 AVAX", "32 AVAX"],
        answer: "2,000 AVAX",
        hint: "Mainnet validators lock a few thousand tokens.",
        explanation:
          "A mainnet Primary Network validator must stake at least 2,000 AVAX on the P-Chain for 14–365 days. Fuji documents a 1 AVAX test minimum. L1 validator slots use a separate continuous-fee model.",
        reference: REFS.nodes,
        funFact: "Validators can also accept delegations from others.",
      },
      {
        id: "m2",
        topic: "validators",
        question: "Which Avalanche chain is used for creating and managing subnets and L1s?",
        options: ["X-Chain", "C-Chain", "P-Chain", "Beacon Chain"],
        answer: "P-Chain",
        hint: "Look for the chain that coordinates validators and custom networks.",
        explanation:
          "Subnet creation, ConvertSubnetToL1, validator additions, and staking transactions are platform-level operations on the P-Chain. The C-Chain runs contracts; the X-Chain moves native assets.",
        reference: REFS.pChain,
        funFact: "The Platform Chain is an instance of the PlatformVM.",
      },
      {
        id: "m3",
        topic: "fundamentals",
        question: "After the Cortina upgrade, the X-Chain uses which consensus style?",
        options: [
          "Linear Snowman blocks",
          "Proof-of-work mining",
          "The historical Avalanche DAG engine only",
          "Tendermint round-robin",
        ],
        answer: "Linear Snowman blocks",
        hint: "The Exchange Chain was linearized onto the same family as P-Chain and C-Chain.",
        explanation:
          "Cortina (April 2023) linearized the X-Chain. It now uses Snowman rather than the historical DAG Avalanche consensus engine. The X-Chain still handles UTXO native-asset transfers; only the ordering engine changed.",
        reference: REFS.xChain,
        funFact: "Most retail users never type X-Chain APIs; wallets wrap those transfers.",
      },
      {
        id: "m4",
        topic: "l1s",
        question: "Avalanche subnet or L1 validators can:",
        options: [
          "Only ever validate one network in their lifetime",
          "Validate multiple networks they opt into",
          "Mine blocks with GPUs",
          "Must validate every L1 in the ecosystem",
        ],
        answer: "Validate multiple networks they opt into",
        hint: "Operators choose which networks they want to secure.",
        explanation:
          "A node can validate several subnets or L1s it opts into. That sovereignty model lets operators skip networks they have no interest in, instead of validating every chain in the ecosystem.",
        reference: REFS.l1s,
        funFact: "L1 validators still typically track P-Chain data used for interoperability.",
      },
      {
        id: "m5",
        topic: "consensus",
        question: "Unlike Bitcoin-style confirmation counts, Snowman acceptance means:",
        options: [
          "The decision is final and irreversible",
          "You should wait about an hour for safety",
          "A later block can still reorg the transaction",
          "Only the block proposer can reverse it",
        ],
        answer: "The decision is final and irreversible",
        hint: "Accepted or rejected is the end of the decision, not a pending fork.",
        explanation:
          "Nakamoto consensus can still reorg a recent block, so wallets wait for extra confirmations. Snowman acceptance is final. Docs describe that as taking about a second, not an hour.",
        reference: REFS.consensus,
        funFact: "Sub-second finality makes Avalanche practical for DeFi and games.",
      },
      {
        id: "m6",
        topic: "icm",
        question: "Why is ICM useful for Avalanche L1s?",
        options: [
          "It enables authenticated cross-chain messaging without a new trusted bridge for every app",
          "It replaces AVAX as the gas token",
          "It removes the need for validators",
          "It replaces Snowman consensus",
        ],
        answer: "It enables authenticated cross-chain messaging without a new trusted bridge for every app",
        hint: "Native messaging across Avalanche networks.",
        explanation:
          "ICM uses BLS signatures from an L1's validator set so another chain can verify a message without a custodial bridge. Relayers still deliver bytes, but they do not become a new source of truth.",
        reference: REFS.icm,
        funFact: "Validator public keys and weights are read from the P-Chain.",
      },
      {
        id: "m7",
        topic: "l1s",
        question: "Compared with a generic sidechain, an Avalanche L1 emphasizes:",
        options: [
          "Custom validator sets and sovereign execution environments",
          "Shared global mempools only",
          "Proof-of-work mining pools",
          "A mandatory Ethereum sequencer",
        ],
        answer: "Custom validator sets and sovereign execution environments",
        hint: "Sovereignty and custom membership.",
        explanation:
          "Each L1 chooses its validators, virtual machine, fees, and access rules. Workloads stay isolated, so a busy NFT mint on the C-Chain does not raise gas on an independent L1.",
        reference: REFS.l1s,
        funFact: "L1s can require KYC, geography, or hardware rules for validators.",
      },
      {
        id: "m8",
        topic: "validators",
        question: "Delegators on Avalanche primarily do what?",
        options: [
          "Stake AVAX with validators to help secure the network",
          "Run a Primary Network validator with 2,000 AVAX",
          "Produce C-Chain blocks without any stake",
          "Issue unlimited AVAX on the X-Chain",
        ],
        answer: "Stake AVAX with validators to help secure the network",
        hint: "This role supports validators without running a node.",
        explanation:
          "Delegators lock AVAX with a chosen validator on the P-Chain. On mainnet the minimum delegation is 25 AVAX. They share staking rewards; the validator still has to stay online for both parties to earn.",
        reference: REFS.platformCli,
        funFact: "Fuji documents a 1 AVAX minimum for both validators and delegators.",
      },
      {
        id: "m9",
        topic: "c-chain",
        question: "What is the Avalanche Fuji C-Chain ID?",
        options: ["43113", "43114", "1", "56"],
        answer: "43113",
        hint: "Testnet ID sits just below the mainnet C-Chain ID.",
        explanation:
          "Fuji C-Chain is 43113 (0xA869). Avalanche mainnet C-Chain is 43114 (0xA86A). Wallets and Hardhat networks must use the matching ID or transactions will fail.",
        reference: REFS.cChain,
        funFact: "Forjora's NetworkGate expects chain ID 43113.",
      },
      {
        id: "m10",
        topic: "evm",
        question: "Which Ethereum-style tools can target the C-Chain with little change?",
        options: [
          "Hardhat, Foundry, Remix, and MetaMask",
          "Bitcoin Core and Electrum only",
          "The Solana Anchor toolchain only",
          "Move Prover with no EVM RPC",
        ],
        answer: "Hardhat, Foundry, Remix, and MetaMask",
        hint: "Anything that speaks EVM JSON-RPC can usually be pointed at Fuji or mainnet.",
        explanation:
          "Coreth exposes Geth-compatible RPC namespaces. Set the RPC URL and chain ID, then deploy Solidity as you would on Ethereum, remembering AVAX gas and Avalanche finality.",
        reference: REFS.coreth,
        funFact: "C-Chain RPC paths look like https://api.avax-test.network/ext/bc/C/rpc on Fuji.",
      },
      {
        id: "m11",
        topic: "tooling",
        question: "Most custom Avalanche L1 contract chains run which virtual machine?",
        options: ["Subnet-EVM", "Bitcoin Script VM", "Move VM only", "The Solana SVM only"],
        answer: "Subnet-EVM",
        hint: "It is Avalanche's L1-oriented fork of the EVM.",
        explanation:
          "Subnet-EVM is a simplified C-Chain-style EVM for L1s. It supports custom gas tokens, genesis allocations, and precompiles. Teams can instead ship a fully custom VM if they need non-EVM execution.",
        reference: REFS.createL1,
        funFact: "ICM contracts currently target Subnet-EVM-based chains.",
      },
      {
        id: "m12",
        topic: "icm",
        question: "Teleporter in the Avalanche stack is best described as:",
        options: [
          "Solidity contracts that make ICM usable from smart contracts",
          "A replacement for Snowman consensus",
          "The P-Chain staking precompile",
          "The Fuji faucet API",
        ],
        answer: "Solidity contracts that make ICM usable from smart contracts",
        hint: "Think TeleporterMessenger on top of Warp/ICM bytes.",
        explanation:
          "ICM is the validator-signed messaging primitive. TeleporterMessenger and TeleporterRegistry are the EVM contracts apps call to send and receive those messages, including upgrade-aware registry lookups.",
        reference: REFS.icmContracts,
        funFact: "A relayer still has to deliver the signed message to the destination chain.",
      },
      {
        id: "m13",
        topic: "consensus",
        question: "Snowman consensus is designed for:",
        options: [
          "A linear chain of blocks",
          "Proof-of-work puzzles",
          "A single elected miner forever",
          "An unordered DAG of transactions only",
        ],
        answer: "A linear chain of blocks",
        hint: "The Primary Network chains use this linear variant of the Snow family.",
        explanation:
          "Snowman takes Snowball-style sampling and decides a totally ordered sequence of blocks. P-Chain, C-Chain, X-Chain (since Cortina), and most L1s use Snowman, often wrapped by Snowman++ proposer windows.",
        reference: REFS.consensus,
        funFact: "The historical Avalanche DAG engine is no longer used on the Primary Network.",
      },
      {
        id: "m14",
        topic: "c-chain",
        question: "Moving AVAX among the X-Chain, P-Chain, and C-Chain uses:",
        options: [
          "Atomic import and export transactions",
          "An Ethereum rollup bridge only",
          "Wrapping AVAX as ERC-20 on Ethereum L1 only",
          "Manual burns with no import",
        ],
        answer: "Atomic import and export transactions",
        hint: "Coreth implements ImportTx and ExportTx against shared memory.",
        explanation:
          "Exports lock AVAX into an atomic UTXO set; imports consume those UTXOs on the destination chain. This is native Primary Network plumbing, not a third-party lock-and-mint bridge.",
        reference: REFS.coreth,
        funFact: "Platform CLI can move AVAX between the P-Chain and C-Chain for you.",
      },
      {
        id: "m15",
        topic: "l1s",
        question: "In Avalanche architecture, a subnet is best described as:",
        options: [
          "A validator set that can validate one or more blockchains",
          "An Ethereum blob-carrying rollup",
          "A centralized database replica",
          "A wallet seed format",
        ],
        answer: "A validator set that can validate one or more blockchains",
        hint: "The L1 is the chain; this term is the dynamic membership group under it.",
        explanation:
          "A subnet is the validator set. An L1 is the sovereign blockchain those validators run. Docs still use subnetID because an L1 starts life with CreateSubnetTx on the P-Chain.",
        reference: REFS.validatorManager,
        funFact: "ACP-77 converted many subnets into independently managed L1s.",
      },
      {
        id: "m16",
        topic: "ecosystem",
        question: "An Avalanche L1 can charge transaction gas in:",
        options: [
          "A custom native token chosen by the L1",
          "Bitcoin only",
          "ETH burned on Ethereum L1 only",
          "No token; execution is always free",
        ],
        answer: "A custom native token chosen by the L1",
        hint: "C-Chain gas is AVAX; L1s can pick something else.",
        explanation:
          "Subnet-EVM lets an L1 define its native gas asset, fee parameters, and whether fees are burned or sent to an address. That is a common reason to leave the shared C-Chain.",
        reference: REFS.l1s,
        funFact: "C-Chain ERC-20s still cannot pay C-Chain gas; only AVAX can.",
      },
    ],
  },
  {
    id: "hard",
    name: "Hard",
    icon: "🔴",
    pointsPerQuestion: 8,
    timePerQuestion: 12,
    description: "Snow protocols, Coreth, Teleporter, ACP-77, and validator economics",
    questions: [
      {
        id: "h1",
        topic: "consensus",
        question: "The Avalanche blockchain consensus protocol family is collectively known as:",
        options: ["Snow Family", "BFT Family", "Ghost Protocol", "Casper FFG"],
        answer: "Snow Family",
        hint: "Protocol names include Snowflake, Snowball, and Slush.",
        explanation:
          "Slush, Snowflake, Snowball, and Snowman are the Snow protocols. Repeated random sampling drives a metastable preference until the network decides. Snowman is the linear-chain variant used on the Primary Network.",
        reference: REFS.consensus,
        funFact: "Snowball, Snowflake, and Slush form the sampling core of the Snow family.",
      },
      {
        id: "h2",
        topic: "evm",
        question: "How does C-Chain execution differ from a typical Ethereum L1 client?",
        options: [
          "It is wrapped by Snowman++ and supports Avalanche atomic transactions",
          "It cannot run Solidity contracts",
          "It uses proof-of-work for every block",
          "Every C-Chain block must settle on Ethereum",
        ],
        answer: "It is wrapped by Snowman++ and supports Avalanche atomic transactions",
        hint: "Coreth is Geth-derived, then adapted for Avalanche consensus and X/P shared memory.",
        explanation:
          "Coreth implements the EVM and Geth-style RPC, so Solidity tools work. Consensus is Snowman++ via ProposerVM, not Ethereum's protocol, and ImportTx/ExportTx move AVAX through atomic shared memory with the X-Chain and P-Chain.",
        reference: REFS.coreth,
        funFact: "Coreth lives in AvalancheGo under graft/coreth.",
      },
      {
        id: "h3",
        topic: "fundamentals",
        question: "What is the maximum supply of AVAX?",
        options: ["21 million", "100 million", "720 million", "Unlimited"],
        answer: "720 million",
        hint: "The cap is under one billion tokens and was fixed at genesis.",
        explanation:
          "AVAX has a hard cap of 720 million tokens created at genesis. There is no open-ended inflation mint. Circulating supply is a separate figure and can move as tokens are staked or fees are burned.",
        reference: REFS.avax,
        funFact: "All AVAX was created at genesis; there is no open-ended inflation mint.",
      },
      {
        id: "h4",
        topic: "l1s",
        question: "After ACP-77 (Avalanche9000 / Etna), Avalanche L1 validators:",
        options: [
          "Are not required to validate the Primary Network",
          "Must also validate Bitcoin",
          "Must run proof-of-work miners",
          "Cannot use a ValidatorManager contract",
        ],
        answer: "Are not required to validate the Primary Network",
        hint: "Sovereign L1s can set membership independently of the three-chain Primary Network.",
        explanation:
          "Classic subnet validators had to validate the Primary Network too. ACP-77 lets L1s manage validators independently; they still rely on P-Chain registry data and typically pay a continuous L1 validation fee (documented around 1.33 AVAX per month) instead of a 2,000 AVAX Primary Network stake.",
        reference: REFS.l1s,
        funFact: "Primary Network validation on mainnet still requires staking 2,000 AVAX.",
      },
      {
        id: "h5",
        topic: "ecosystem",
        question: "What happens to AVAX paid as C-Chain transaction fees?",
        options: [
          "They are burned",
          "They are paid to a miner set",
          "They are bridged to Ethereum validators",
          "They mint new AVAX 1:1",
        ],
        answer: "They are burned",
        hint: "Fees are destroyed as part of the transaction, not paid out as block rewards.",
        explanation:
          "C-Chain gas is paid in AVAX and burned. Coreth applies an EIP-1559-style base fee; burning reduces circulating supply rather than transferring those fees to miners. An L1 can choose a different fee policy for its own gas token.",
        reference: REFS.coreth,
        funFact: "An L1 can configure whether its own gas is burned or redirected.",
      },
      {
        id: "h6",
        topic: "icm",
        question: "ICM messages between Avalanche L1s:",
        options: [
          "Do not have to be recorded on a Primary Network message bus",
          "Must be posted as C-Chain events before they are valid",
          "Are mined into Bitcoin for settlement",
          "Replace the need for destination-chain validators",
        ],
        answer: "Do not have to be recorded on a Primary Network message bus",
        hint: "Delivery is peer-to-peer between L1s; authenticity comes from validator signatures.",
        explanation:
          "ICM has no required global inbox on the Primary Network. Relayers carry bytes from origin to destination. The destination verifies an aggregated BLS proof against P-Chain validator weights, so private L1s can communicate without publishing the payload on C-Chain.",
        reference: REFS.icm,
        funFact: "Each L1 pair can choose the stake threshold required to accept a message.",
      },
      {
        id: "h7",
        topic: "l1s",
        question: "Which membership rule can an Avalanche L1 impose that the public C-Chain cannot?",
        options: [
          "Only authorized addresses may deploy contracts or send transactions",
          "Consensus must be proof-of-work",
          "Gas must be paid in ETH on Ethereum",
          "Every wallet must also validate Bitcoin",
        ],
        answer: "Only authorized addresses may deploy contracts or send transactions",
        hint: "Subnet-EVM allow-lists can restrict deployers and senders.",
        explanation:
          "The C-Chain is open: anyone can deploy and transact. Subnet-EVM allow-lists let an L1 require KYC'd, licensed, or otherwise authorized users. That is a compliance and access-control feature, not a change to Snowman sampling.",
        reference: REFS.l1s,
        funFact: "You can start on C-Chain and move to an L1 after product-market fit.",
      },
      {
        id: "h8",
        topic: "consensus",
        question: "In Avalanche consensus sampling, validators repeatedly query:",
        options: [
          "Small random subsets of other validators",
          "Only the largest mining pool",
          "A single elected leader forever",
          "The entire validator set in every round",
        ],
        answer: "Small random subsets of other validators",
        hint: "Repeated randomized sampling.",
        explanation:
          "Each validator asks a small stake-weighted sample (parameter k, typically 20) for their preference and repeats until a quorum holds for enough rounds (α ≈ 14, β ≈ 20 in documented defaults). Message cost stays nearly constant as the validator set grows.",
        reference: REFS.consensus,
        funFact: "A vote for a block also counts as a vote for that block's ancestors.",
      },
      {
        id: "h9",
        topic: "c-chain",
        question: "In AvalancheGo, Coreth is:",
        options: [
          "The EVM implementation that powers the C-Chain",
          "The default VM for custom Avalanche L1s",
          "The P-Chain PlatformVM",
          "The X-Chain AVM",
        ],
        answer: "The EVM implementation that powers the C-Chain",
        hint: "It is AvalancheGo's Geth-derived contract engine.",
        explanation:
          "Coreth executes C-Chain blocks, applies EIP-1559 base fees, serves eth/net/web3 RPCs, and handles atomic import/export with X-Chain and P-Chain shared memory. Snowman++ (ProposerVM) wraps it for paced block production.",
        reference: REFS.coreth,
        funFact: "Fuji and mainnet C-Chain IDs are configured inside this VM, not in MetaMask alone.",
      },
      {
        id: "h10",
        topic: "consensus",
        question: "Snowman++ adds which block-production feature on top of Snowman?",
        options: [
          "Stake-weighted proposer windows",
          "A requirement that every validator propose every block",
          "A switch back to proof-of-work",
          "Leaderless DAG voting only",
        ],
        answer: "Stake-weighted proposer windows",
        hint: "A short slot lets a sampled validator build before the next one.",
        explanation:
          "ProposerVM samples a stake-weighted proposer list and gives each a short window (documented as 5 seconds) to build. That paces blocks on P-Chain and C-Chain instead of letting every validator race the same height.",
        reference: REFS.coreth,
        funFact: "If a proposer misses its window, the next sampled validator may build.",
      },
      {
        id: "h11",
        topic: "icm",
        question: "ICM message authenticity is verified using:",
        options: [
          "Aggregated BLS signatures from origin L1 validators",
          "A trusted multi-sig of three companies only",
          "Proof-of-work headers from Bitcoin",
          "ECDSA signatures from a single relayer",
        ],
        answer: "Aggregated BLS signatures from origin L1 validators",
        hint: "Many validator signatures compress into one short proof.",
        explanation:
          "Every Avalanche validator holds a BLS key. Individual signatures aggregate, so a destination chain verifies one multi-signature against known P-Chain public keys and stake weights instead of checking thousands of signatures.",
        reference: REFS.icm,
        funFact: "ICM adds no extra trust assumption beyond the origin L1's validators being honest.",
      },
      {
        id: "h12",
        topic: "validators",
        question: "ACP-77 L1s typically manage membership with:",
        options: [
          "A ValidatorManager contract",
          "A hardcoded list in MetaMask",
          "The Ethereum deposit contract",
          "A Bitcoin difficulty file",
        ],
        answer: "A ValidatorManager contract",
        hint: "PoA or PoS manager contracts own this membership logic.",
        explanation:
          "After ConvertSubnetToL1Tx, initializeValidatorSet consumes a P-Chain conversion message. Later registrations go through ValidatorManager plus NativeTokenStakingManager, ERC20TokenStakingManager, or PoAManager, with ICM messages back to the P-Chain.",
        reference: REFS.validatorManager,
        funFact: "Initial conversion validators are treated as PoA and are not staking-reward eligible.",
      },
      {
        id: "h13",
        topic: "tooling",
        question: "Builder Hub currently recommends which CLI for P-Chain staking, subnet creation, and L1 validators?",
        options: ["Platform CLI", "Avalanche-CLI", "Bitcoin Core CLI", "The Solana CLI"],
        answer: "Platform CLI",
        hint: "The older Avalanche-CLI is documented as deprecated for these jobs.",
        explanation:
          "Platform CLI handles keys, P/C transfers, Primary Network staking, subnet creation, and L1 validator registration. Avalanche-CLI is documented as deprecated; Builder Console covers other L1 and ICM workflows.",
        reference: REFS.platformCli,
        funFact: "On Fuji, Platform CLI lists 1 AVAX minimums for validators and delegators.",
      },
      {
        id: "h14",
        topic: "validators",
        question: "If a Primary Network validator has poor uptime, Avalanche typically:",
        options: [
          "Does not slash the stake, but the validator may miss rewards",
          "Burns the entire stake automatically",
          "Converts the node into a delegator",
          "Raises the AVAX maximum supply",
        ],
        answer: "Does not slash the stake, but the validator may miss rewards",
        hint: "Official consensus docs describe returning stake without a penalty burn.",
        explanation:
          "Avalanche does not slash for downtime the way some proof-of-stake chains do. A misbehaving or offline validator can still recover principal, but rewards require sufficient correctness and uptime.",
        reference: REFS.consensus,
        funFact: "Safety still depends on enough bonded AVAX sitting with honest validators.",
      },
      {
        id: "h15",
        topic: "tooling",
        question: "Which Primary Network validator minimums match current docs?",
        options: [
          "Fuji 1 AVAX; mainnet 2,000 AVAX",
          "Fuji 2,000 AVAX; mainnet 1 AVAX",
          "Both networks 32 ETH",
          "Both networks 720 million AVAX",
        ],
        answer: "Fuji 1 AVAX; mainnet 2,000 AVAX",
        hint: "Testnet parameters are far smaller than mainnet.",
        explanation:
          "Platform CLI documents Fuji (and local) validator/delegator minima at 1 AVAX, and mainnet at 2,000 AVAX to validate and 25 AVAX to delegate. Always check current docs before staking real funds.",
        reference: REFS.platformCli,
        funFact: "Forjora itself never stakes for you; it only quizzes and mints on Fuji.",
      },
      {
        id: "h16",
        topic: "icm",
        question: "ICTT in the Avalanche stack refers to:",
        options: [
          "Interchain Token Transfer between L1s",
          "Internal Chain Time Travel",
          "A C-Chain gas rebate NFT",
          "Instant Consensus Test Tokens",
        ],
        answer: "Interchain Token Transfer between L1s",
        hint: "Token contracts that ride on top of ICM/Teleporter.",
        explanation:
          "ICTT contracts move tokens among Avalanche L1s using ICM. That is native interoperability for assets, distinct from locking those assets on a generic third-party bridge to an unrelated ecosystem.",
        reference: REFS.icmContracts,
        funFact: "Builder Hub documents separate ICM setup and ICTT setup flows.",
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
