import fs from "fs";
import path from "path";
import hre from "hardhat";

function requirePrivateKey() {
  const key = (process.env.PRIVATE_KEY || "").trim();
  if (!key) {
    throw new Error(
      [
        "PRIVATE_KEY is missing or empty.",
        "Add a funded Avalanche Fuji deployer key to .env (never commit it):",
        "  PRIVATE_KEY=0xyour64hexchars",
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
  const networkName = hre.network.name;
  if (networkName !== "hardhat") {
    requirePrivateKey();
  }
  if (networkName === "avalanche" && process.env.CONFIRM_MAINNET !== "yes") {
    throw new Error("Mainnet deploy is gated. Set CONFIRM_MAINNET=yes after the security checklist.");
  }

  const [signer] = await hre.ethers.getSigners();
  const deployer = await signer.getAddress();
  const { chainId } = await hre.ethers.provider.getNetwork();

  const nonce = await hre.network.provider.send("eth_getTransactionCount", [
    deployer,
    "latest",
  ]);

  const Credential = await hre.ethers.getContractFactory("SkillForgeCredential");
  const deployTx = await Credential.getDeployTransaction();
  const estimatedGas = await hre.network.provider.send("eth_estimateGas", [
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
  if (networkName !== "hardhat") {
    upsertEnvValue(path.join(process.cwd(), ".env"), "VITE_CREDENTIAL_CONTRACT", address);
  }

  console.log("SkillForgeCredential deployed to:", address);
  console.log("Deployment record:", outFile);
  if (networkName !== "hardhat") {
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
