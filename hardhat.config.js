import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env" });

// Only apply .env.local values that are non-empty so placeholders do not wipe .env.
const localEnvPath = ".env.local";
if (fs.existsSync(localEnvPath)) {
  const localEnv = dotenv.parse(fs.readFileSync(localEnvPath));
  for (const [key, value] of Object.entries(localEnv)) {
    if (String(value).trim() !== "") {
      process.env[key] = value;
    }
  }
}

function deployerAccounts() {
  const key = (process.env.PRIVATE_KEY || "").trim();
  if (!key) return [];
  return [key.startsWith("0x") ? key : `0x${key}`];
}

const fujiUrl = process.env.FUJI_RPC_URL || "https://avalanche-fuji-c-chain.publicnode.com";
const accounts = deployerAccounts();

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
      accounts,
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts,
    },
  },
  paths: {
    sources: "./contracts",
  },
};
