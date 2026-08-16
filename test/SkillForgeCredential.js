import { expect } from "chai";
import hre from "hardhat";

describe("SkillForgeCredential", function () {
  async function deployCredential() {
    const [owner, learner, other] = await hre.ethers.getSigners();
    const Credential = await hre.ethers.getContractFactory("SkillForgeCredential");
    const credential = await Credential.deploy();
    await credential.waitForDeployment();
    return { credential, owner, learner, other };
  }

  async function mintFor(credential, learner, points = 15) {
    await credential.connect(learner).mintCredential(points, 1, 5, 0, 0, "ipfs://bafy-artwork");
  }

  it("starts token IDs at one and stores the learner credential", async function () {
    const { credential, learner } = await deployCredential();

    await mintFor(credential, learner);

    expect(await credential.credentialOf(learner.address)).to.equal(1n);
    expect(await credential.ownerOf(1n)).to.equal(learner.address);
  });

  it("replaces a learner's previous credential on remint", async function () {
    const { credential, learner } = await deployCredential();
    await mintFor(credential, learner, 15);

    await mintFor(credential, learner, 20);

    expect(await credential.credentialOf(learner.address)).to.equal(2n);
    await expect(credential.ownerOf(1n)).to.be.revertedWithCustomError(credential, "ERC721NonexistentToken");
    expect((await credential.credentials(2n)).totalPoints).to.equal(20n);
  });

  it("rejects transfers while allowing mint and burn internals", async function () {
    const { credential, learner, other } = await deployCredential();
    await mintFor(credential, learner);

    await expect(
      credential.connect(learner).transferFrom(learner.address, other.address, 1n)
    ).to.be.revertedWith("Soulbound: non-transferable");
  });

  it("rejects invalid credential values", async function () {
    const { credential, learner } = await deployCredential();

    await expect(
      credential.connect(learner).mintCredential(0, 1, 0, 0, 0, "")
    ).to.be.revertedWith("No points earned");
    await expect(
      credential.connect(learner).mintCredential(1, 0, 0, 0, 0, "")
    ).to.be.revertedWith("Invalid puzzle mask");
  });

  it("accepts a non-replayable owner-signed credential authorization", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { chainId } = await hre.ethers.provider.getNetwork();
    const imageData = "ipfs://bafy-artwork";
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const domain = {
      name: "SkillForgeCredential",
      version: "1",
      chainId,
      verifyingContract: await credential.getAddress(),
    };
    const types = {
      Credential: [
        { name: "learner", type: "address" },
        { name: "totalPoints", type: "uint256" },
        { name: "puzzleMask", type: "uint256" },
        { name: "easyCorrect", type: "uint8" },
        { name: "mediumCorrect", type: "uint8" },
        { name: "hardCorrect", type: "uint8" },
        { name: "imageHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
    const value = {
      learner: learner.address,
      totalPoints: 15n,
      puzzleMask: 1n,
      easyCorrect: 5,
      mediumCorrect: 0,
      hardCorrect: 0,
      imageHash: hre.ethers.keccak256(hre.ethers.toUtf8Bytes(imageData)),
      nonce: 0n,
      deadline,
    };
    const signature = await owner.signTypedData(domain, types, value);

    await credential
      .connect(learner)
      .mintCredentialWithAuthorization(15, 1, 5, 0, 0, imageData, deadline, signature);

    expect(await credential.credentialOf(learner.address)).to.equal(1n);
    await expect(
      credential
        .connect(learner)
        .mintCredentialWithAuthorization(15, 1, 5, 0, 0, imageData, deadline, signature)
    ).to.be.revertedWith("Invalid authorization");
  });
});
