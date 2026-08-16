import hre from "hardhat";

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required. Copy .env.example to .env and provide a funded Fuji deployer key.");
  }

  const [signer] = await hre.ethers.getSigners();

  // Many Fuji public RPCs do NOT support the "pending" block tag, which
  // makes Hardhat's default nonce/estimateGas flow fail with
  // "state not available for pending block". Fetch nonce with "latest".
  const nonce = await hre.network.provider.send("eth_getTransactionCount", [
    await signer.getAddress(),
    "latest",
  ]);

  const Credential = await hre.ethers.getContractFactory("SkillForgeCredential");

  // Estimate gas against "latest" (bypass pending-block queries) then add a
  // generous buffer. We pass an explicit nonce + gasLimit to keep the signer
  // from querying the pending block.
  const deployTx = await Credential.getDeployTransaction();
  const estimatedGas = await hre.network.provider.send("eth_estimateGas", [
    { from: await signer.getAddress(), data: deployTx.data },
    "latest",
  ]);

  const credential = await Credential.deploy({
    nonce,
    gasLimit: BigInt(estimatedGas) * 12n / 10n, // +20% buffer
  });
  await credential.waitForDeployment();

  const address = await credential.getAddress();
  console.log("SkillForgeCredential deployed to:", address);
  console.log("Set VITE_CREDENTIAL_CONTRACT in .env to:", address);
  console.log("Set VITE_CREDENTIAL_IMAGE_URI to a stable IPFS or HTTPS artwork URL before minting.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
