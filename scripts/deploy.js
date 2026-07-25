import hre from "hardhat";

async function main() {
  const Credential = await hre.ethers.getContractFactory("SkillForgeCredential");
  const credential = await Credential.deploy();
  await credential.waitForDeployment();

  const address = await credential.getAddress();
  console.log("SkillForgeCredential deployed to:", address);
  console.log("Set VITE_CREDENTIAL_CONTRACT in .env to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
