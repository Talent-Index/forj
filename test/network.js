import hre from "hardhat";

const connection = await hre.network.create();

export const { ethers, networkHelpers } = connection;
export const provider = ethers.provider;

export async function deploySkillForgeCredential() {
  const [owner, learner, other] = await ethers.getSigners();
  const Credential = await ethers.getContractFactory("SkillForgeCredential");
  const credential = await Credential.deploy();
  await credential.waitForDeployment();
  return { credential, owner, learner, other };
}
