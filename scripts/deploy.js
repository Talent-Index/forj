import fs from "fs";
import path from "path";
import hre from "hardhat";

import { C_CHAIN_ID, mainnetIssuanceAllowed } from "../src/utils/productionGate.js";
import { FUJI_CHAIN_ID } from "../src/utils/wallet.js";

function requestedNetworkName() {
  const index = process.argv.indexOf("--network");
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return "";
}

function refuseClosedCChainIssuance(networkName) {
  if (networkName !== "avalanche") return;
  if (!mainnetIssuanceAllowed()) {
    throw new Error(
      "Avalanche C-Chain issuance is closed. Freeze v1 is not independently reviewed, and issuer operations and monitoring are not production-ready."
    );
  }
  if (process.env.CONFIRM_MAINNET !== "yes") {
    throw new Error("C-Chain deploy also requires explicit confirmation after the production gate opens.");
  }
}

function requirePrivateKey() {
  const key = (process.env.PRIVATE_KEY || "").trim();
  if (!key) {
    throw new Error(
      [
        "PRIVATE_KEY is missing or empty.",
        "Add a funded Avalanche Fuji deployer key to .env (never commit it):",
        "  PRIVATE_KEY=0xyour64hexchars",
        "If you use .env.local, either set PRIVATE_KEY there or remove the empty line",
        "(an empty PRIVATE_KEY= in .env.local overrides .env).",
        "Then retry: npm run deploy:fuji",
        "Get test AVAX from a Fuji faucet if the account has no balance.",
      ].join("\n")
    );
  }
}

function deploymentsPath(networkName) {
  return path.join(process.cwd(), "deployments", `${networkName}.json`);
}

function upsertEnvValue(filePath, key, value) {
  if (!fs.existsSync(filePath)) return false;
  const source = fs.readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const next = pattern.test(source)
    ? source.replace(pattern, `${key}=${value}`)
    : `${source.trimEnd()}\n${key}=${value}\n`;
  fs.writeFileSync(filePath, next);
  return true;
}

async function main() {
  refuseClosedCChainIssuance(requestedNetworkName());
  const connection = await hre.network.create();
  const { ethers } = connection;
  const provider = ethers.provider;
  const networkName = connection.networkName || connection.name || "default";
  refuseClosedCChainIssuance(networkName);
  const isRemote = networkName !== "hardhat" && networkName !== "default";
  if (isRemote) {
    requirePrivateKey();
  }

  const [signer] = await ethers.getSigners();
  const deployer = await signer.getAddress();
  const { chainId } = await provider.getNetwork();
  if (networkName === "avalanche" && Number(chainId) !== C_CHAIN_ID) {
    throw new Error("Avalanche network is not C-Chain.");
  }
  if (networkName === "fuji" && Number(chainId) !== FUJI_CHAIN_ID) {
    throw new Error("Fuji network is not the Fuji chain.");
  }

  const nonce = await provider.send("eth_getTransactionCount", [
    deployer,
    "latest",
  ]);

  const Credential = await ethers.getContractFactory("SkillForgeCredential");
  const deployTx = await Credential.getDeployTransaction();
  const estimatedGas = await provider.send("eth_estimateGas", [
    { from: deployer, data: deployTx.data },
    "latest",
  ]);

  const credential = await Credential.deploy({
    nonce,
    gasLimit: (BigInt(estimatedGas) * 12n) / 10n,
  });
  const pending = credential.deploymentTransaction();
  await credential.waitForDeployment();

  const address = await credential.getAddress();
  const record = {
    contract: "SkillForgeCredential",
    freezeId: "v1",
    eip712Name: "SkillForgeCredential",
    eip712Version: "1",
    network: networkName,
    chainId: Number(chainId),
    address,
    deployer,
    txHash: pending?.hash || null,
    deployedAt: new Date().toISOString(),
  };

  const outFile = deploymentsPath(networkName);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(record, null, 2)}\n`);
  if (isRemote) {
    upsertEnvValue(path.join(process.cwd(), ".env"), "VITE_CREDENTIAL_CONTRACT", address);
  }

  console.log("SkillForgeCredential deployed to:", address);
  console.log("Deployment record:", outFile);
  if (isRemote) {
    console.log("VITE_CREDENTIAL_CONTRACT updated in .env when that file exists.");
  }
  console.log("Set VITE_CREDENTIAL_IMAGE_URI to a stable IPFS or HTTPS artwork URL before minting.");
  if (networkName === "fuji") {
    console.log(`Snowtrace: https://testnet.snowtrace.io/address/${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
