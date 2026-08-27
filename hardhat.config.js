import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
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
  const privateKey = key.startsWith("0x") ? key : `0x${key}`;
  return [privateKey];
}

const fujiUrl = process.env.FUJI_RPC_URL || "https://avalanche-fuji-c-chain.publicnode.com";
const avalancheUrl = (() => {
  const raw = (process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc").trim();
  if (/fuji|avax-test/i.test(raw)) return "https://api.avax.network/ext/bc/C/rpc";
  return raw;
})();
const accounts = deployerAccounts();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.26",
    settings: {
      // OpenZeppelin 5.3 requires the mcopy opcode → Cancun EVM target.
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./contracts",
  },
  networks: {
    fuji: {
      type: "http",
      chainType: "l1",
      url: fujiUrl,
      chainId: 43113,
      accounts,
    },
    avalanche: {
      type: "http",
      chainType: "l1",
      url: avalancheUrl,
      chainId: 43114,
      accounts,
    },
  },
});
