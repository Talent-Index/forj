import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const fujiUrl = process.env.FUJI_RPC_URL || "https://avalanche-fuji-c-chain.publicnode.com";
const deployerAccounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.26",
    settings: {
      // OpenZeppelin 5.3 requires the mcopy opcode → Cancun EVM target.
      evmVersion: "cancun",
    },
  },
  networks: {
    fuji: {
      url: fujiUrl,
      chainId: 43113,
      accounts: deployerAccounts,
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: deployerAccounts,
    },
  },
  paths: {
    sources: "./contracts",
  },
};
