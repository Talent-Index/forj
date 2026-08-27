import { expect } from "chai";
import { ethers, provider, deploySkillForgeCredential } from "./network.js";
import { validateCredentialMetadata } from "../src/utils/credentialMetadata.js";

const IMAGE = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

function decodeTokenURI(uri) {
  const prefix = "data:application/json;base64,";
  expect(uri.startsWith(prefix)).to.equal(true);
  return JSON.parse(Buffer.from(uri.slice(prefix.length), "base64").toString("utf8"));
}

describe("SkillForgeCredential", function () {
  async function deployCredential() {
    return deploySkillForgeCredential();
  }

  async function domainFor(credential) {
    const { chainId } = await provider.getNetwork();
    return {
      name: "SkillForgeCredential",
      version: "1",
      chainId,
      verifyingContract: await credential.getAddress(),
    };
  }

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

  async function signAttestation(credential, signer, learner, overrides = {}) {
    const latest = (await provider.getBlock("latest")).timestamp;
    const value = {
      learner: learner.address,
      totalPoints: 15n,
      puzzleMask: 1n,
      easyCorrect: 5,
      mediumCorrect: 0,
      hardCorrect: 0,
      imageHash: ethers.keccak256(ethers.toUtf8Bytes(IMAGE)),
      nonce: 0n,
      deadline: BigInt(latest + 3600),
      ...overrides,
    };
    const signature = await signer.signTypedData(await domainFor(credential), types, value);
    return { value, signature };
  }

  it("sets name, symbol, owner, and starts token IDs at one", async function () {
    const { credential, owner, learner } = await deployCredential();

    expect(await credential.name()).to.equal("SkillForge Avalanche Credential");
    expect(await credential.symbol()).to.equal("SFAVAX");
    expect(await credential.owner()).to.equal(owner.address);

    await credential.connect(learner).mintCredential(15, 1, 5, 0, 0, IMAGE);
    expect(await credential.credentialOf(learner.address)).to.equal(1n);
    expect(await credential.ownerOf(1n)).to.equal(learner.address);
  });

  it("stores claimed scores and marks the mint as self-claimed", async function () {
    const { credential, learner } = await deployCredential();

    await expect(credential.connect(learner).mintCredential(12, 3, 4, 0, 0, IMAGE))
      .to.emit(credential, "CredentialMinted")
      .withArgs(learner.address, 1n, 12n, 3n, false);

    const data = await credential.credentials(1n);
    expect(data.totalPoints).to.equal(12n);
    expect(data.puzzleMask).to.equal(3n);
    expect(data.easyCorrect).to.equal(4n);
    expect(data.mediumCorrect).to.equal(0n);
    expect(data.hardCorrect).to.equal(0n);
    expect(data.image).to.equal(IMAGE);
    expect(data.attested).to.equal(false);

    const metadata = decodeTokenURI(await credential.tokenURI(1n));
    expect(metadata.image).to.equal(IMAGE);
    expect(validateCredentialMetadata(metadata).ok).to.equal(true);
    expect(metadata.description).to.match(/Self-claimed/);
    expect(metadata.attributes.find((item) => item.trait_type === "Attestation").value).to.equal("Self claimed");
    expect(metadata.attributes.find((item) => item.trait_type === "Puzzle Pieces").value).to.equal(2);
  });

  it("replaces a learner's previous credential on remint", async function () {
    const { credential, learner } = await deployCredential();
    await credential.connect(learner).mintCredential(15, 1, 5, 0, 0, IMAGE);
    await credential.connect(learner).mintCredential(20, 2, 5, 1, 0, IMAGE);

    expect(await credential.credentialOf(learner.address)).to.equal(2n);
    await expect(credential.ownerOf(1n)).to.be.revertedWithCustomError(credential, "ERC721NonexistentToken");
    expect((await credential.credentials(1n)).totalPoints).to.equal(0n);
    expect((await credential.credentials(2n)).totalPoints).to.equal(20n);
  });

  it("rejects invalid claimed mint values", async function () {
    const { credential, learner } = await deployCredential();

    await expect(
      credential.connect(learner).mintCredential(0, 1, 0, 0, 0, "")
    ).to.be.revertedWith("No points earned");
    await expect(
      credential.connect(learner).mintCredential(1, 0, 0, 0, 0, "")
    ).to.be.revertedWith("Invalid puzzle mask");
    await expect(
      credential.connect(learner).mintCredential(1, 0x10000, 0, 0, 0, "")
    ).to.be.revertedWith("Invalid puzzle mask");
    await expect(
      credential.connect(learner).mintCredential(1, 1, 6, 0, 0, "")
    ).to.be.revertedWith("Invalid scores");
  it("rejects scores above the on-chain maximum", async function () {
    const { credential, learner } = await deployCredential();
    const maxPoints = await credential.MAX_POINTS();
    expect(maxPoints).to.equal(80n);

    await expect(
      credential.connect(learner).mintCredential(maxPoints + 1n, 1, 5, 5, 5, IMAGE)
    ).to.be.revertedWith("Score exceeds maximum");
    await credential.connect(learner).mintCredential(maxPoints, 1, 5, 5, 5, IMAGE);
    expect((await credential.credentials(1n)).totalPoints).to.equal(maxPoints);
  });

  it("rejects JSON-breaking and oversized image URIs", async function () {
    const { credential, learner } = await deployCredential();

    await expect(
      credential.connect(learner).mintCredential(1, 1, 0, 0, 0, 'ipfs://"bad"')
    ).to.be.revertedWith("Invalid image");
    await expect(
      credential.connect(learner).mintCredential(1, 1, 0, 0, 0, "ipfs://foo\\")
    ).to.be.revertedWith("Invalid image");
    await expect(
      credential.connect(learner).mintCredential(1, 1, 0, 0, 0, "javascript:alert(1)")
    ).to.be.revertedWith("Invalid image");
    await expect(
      credential.connect(learner).mintCredential(1, 1, 0, 0, 0, `ipfs://${"a".repeat(250)}`)
    ).to.be.revertedWith("Invalid image");
  });

  it("accepts empty, ipfs, and https artwork URIs", async function () {
    const { credential, learner, other } = await deployCredential();
    await credential.connect(learner).mintCredential(1, 1, 0, 0, 0, "");
    expect((await credential.credentials(1n)).image).to.equal("");
    await credential.connect(other).mintCredential(1, 1, 0, 0, 0, "https://example.com/forge-certificate.jpg");
    expect((await credential.credentials(2n)).image).to.equal("https://example.com/forge-certificate.jpg");
  });

  it("does not allow tokenURI reads for burned or missing tokens", async function () {
    const { credential, learner } = await deployCredential();
    await expect(credential.tokenURI(1n)).to.be.revertedWithCustomError(credential, "ERC721NonexistentToken");
    await credential.connect(learner).mintCredential(15, 1, 5, 0, 0, IMAGE);
    await credential.connect(learner).mintCredential(16, 1, 5, 0, 0, IMAGE);
    await expect(credential.tokenURI(1n)).to.be.revertedWithCustomError(credential, "ERC721NonexistentToken");
  });

  it("blocks transfers, approvals, and operator approvals", async function () {
    const { credential, learner, other } = await deployCredential();
    await credential.connect(learner).mintCredential(15, 1, 5, 0, 0, IMAGE);

    await expect(
      credential.connect(learner).transferFrom(learner.address, other.address, 1n)
    ).to.be.revertedWith("Soulbound: non-transferable");
    await expect(
      credential.connect(learner)["safeTransferFrom(address,address,uint256)"](learner.address, other.address, 1n)
    ).to.be.revertedWith("Soulbound: non-transferable");
    await expect(
      credential.connect(learner).approve(other.address, 1n)
    ).to.be.revertedWith("Soulbound: non-transferable");
    await expect(
      credential.connect(learner)["safeTransferFrom(address,address,uint256,bytes)"](
        learner.address,
        other.address,
        1n,
        "0x"
      )
    ).to.be.revertedWith("Soulbound: non-transferable");
    expect(await credential.getApproved(1n)).to.equal(ethers.ZeroAddress);
    expect(await credential.isApprovedForAll(learner.address, other.address)).to.equal(false);
  });

  it("uses two-step ownership and refuses renounce", async function () {
    const { credential, owner, learner, other } = await deployCredential();

    await expect(
      credential.connect(learner).transferOwnership(other.address)
    ).to.be.revertedWithCustomError(credential, "OwnableUnauthorizedAccount");
    await expect(credential.connect(owner).renounceOwnership())
      .to.be.revertedWith("Ownership cannot be renounced");

    await credential.connect(owner).transferOwnership(other.address);
    expect(await credential.owner()).to.equal(owner.address);
    expect(await credential.pendingOwner()).to.equal(other.address);

    await credential.connect(other).acceptOwnership();
    expect(await credential.owner()).to.equal(other.address);
    expect(await credential.pendingOwner()).to.equal(ethers.ZeroAddress);
  });

  it("rejects attestations from a previous owner after the handoff", async function () {
    const { credential, owner, learner, other } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);

    await credential.connect(owner).transferOwnership(other.address);
    await credential.connect(other).acceptOwnership();

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        value.totalPoints,
        value.puzzleMask,
        value.easyCorrect,
        value.mediumCorrect,
        value.hardCorrect,
        IMAGE,
        value.deadline,
        signature
      )
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("accepts owner-signed attestation and marks the mint as attested", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        value.totalPoints,
        value.puzzleMask,
        value.easyCorrect,
        value.mediumCorrect,
        value.hardCorrect,
        IMAGE,
        value.deadline,
        signature
      )
    ).to.emit(credential, "CredentialMinted").withArgs(learner.address, 1n, 15n, 1n, true);

    expect(await credential.authorizationNonces(learner.address)).to.equal(1n);
    expect((await credential.credentials(1n)).attested).to.equal(true);
    const metadata = decodeTokenURI(await credential.tokenURI(1n));
    expect(metadata.description).to.match(/Issuer-attested/);
    expect(validateCredentialMetadata(metadata).ok).to.equal(true);
    expect(metadata.attributes.find((item) => item.trait_type === "Attestation").value).to.equal("Issuer attested");
  });

  it("rejects unauthorized and invalid attestations without consuming a nonce", async function () {
    const { credential, owner, learner, other } = await deployCredential();
    const latest = (await provider.getBlock("latest")).timestamp;
    const { value, signature } = await signAttestation(credential, owner, learner);
    const outsider = await signAttestation(credential, other, learner);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        value.totalPoints,
        value.puzzleMask,
        value.easyCorrect,
        value.mediumCorrect,
        value.hardCorrect,
        IMAGE,
        value.deadline,
        outsider.signature
      )
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);

    await expect(
      credential.connect(other).mintCredentialWithAuthorization(
        value.totalPoints,
        value.puzzleMask,
        value.easyCorrect,
        value.mediumCorrect,
        value.hardCorrect,
        IMAGE,
        value.deadline,
        signature
      )
    ).to.be.revertedWith("Invalid authorization");

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        value.totalPoints,
        value.puzzleMask,
        value.easyCorrect,
        value.mediumCorrect,
        value.hardCorrect,
        IMAGE,
        BigInt(latest - 1),
        signature
      )
    ).to.be.revertedWith("Authorization expired");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("rejects replayed attestations after a successful mint", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);

    await credential.connect(learner).mintCredentialWithAuthorization(
      value.totalPoints,
      value.puzzleMask,
      value.easyCorrect,
      value.mediumCorrect,
      value.hardCorrect,
      IMAGE,
      value.deadline,
      signature
    );

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        value.totalPoints,
        value.puzzleMask,
        value.easyCorrect,
        value.mediumCorrect,
        value.hardCorrect,
        IMAGE,
        value.deadline,
        signature
      )
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(1n);
  });

  it("does not consume a nonce when attested mint inputs are invalid", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner, {
      totalPoints: 0n,
      puzzleMask: 1n,
    });

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        0,
        1,
        value.easyCorrect,
        value.mediumCorrect,
        value.hardCorrect,
        IMAGE,
        value.deadline,
        signature
      )
    ).to.be.revertedWith("No points earned");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("does not let a learner promote a claimed credential to attested", async function () {
    const { credential, learner } = await deployCredential();
    await credential.connect(learner).mintCredential(15, 1, 5, 0, 0, IMAGE);
    expect((await credential.credentials(1n)).attested).to.equal(false);

    const selfSigned = await signAttestation(credential, learner, learner);
    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        selfSigned.value.totalPoints,
        selfSigned.value.puzzleMask,
        selfSigned.value.easyCorrect,
        selfSigned.value.mediumCorrect,
        selfSigned.value.hardCorrect,
        IMAGE,
        selfSigned.value.deadline,
        selfSigned.signature
      )
    ).to.be.revertedWith("Invalid authorization");

    expect(await credential.credentialOf(learner.address)).to.equal(1n);
    expect((await credential.credentials(1n)).attested).to.equal(false);
    const metadata = decodeTokenURI(await credential.tokenURI(1n));
    expect(metadata.attributes.find((item) => item.trait_type === "Attestation").value).to.equal("Self claimed");
  });

  it("writes a new claimed credential when a learner remints after attestation", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);
    await credential.connect(learner).mintCredentialWithAuthorization(
      value.totalPoints,
      value.puzzleMask,
      value.easyCorrect,
      value.mediumCorrect,
      value.hardCorrect,
      IMAGE,
      value.deadline,
      signature
    );
    expect((await credential.credentials(1n)).attested).to.equal(true);

    await credential.connect(learner).mintCredential(20, 3, 5, 1, 0, IMAGE);
    expect(await credential.credentialOf(learner.address)).to.equal(2n);
    await expect(credential.ownerOf(1n)).to.be.revertedWithCustomError(credential, "ERC721NonexistentToken");
    expect((await credential.credentials(2n)).attested).to.equal(false);
    const metadata = decodeTokenURI(await credential.tokenURI(2n));
    expect(metadata.description).to.match(/Self-claimed/);
  });

  it("keeps credential data isolated per wallet", async function () {
    const { credential, learner, other } = await deployCredential();
    await credential.connect(learner).mintCredential(15, 1, 5, 0, 0, IMAGE);
    await credential.connect(other).mintCredential(40, 7, 5, 5, 0, IMAGE);

    expect(await credential.credentialOf(learner.address)).to.equal(1n);
    expect(await credential.credentialOf(other.address)).to.equal(2n);
    expect((await credential.credentials(1n)).totalPoints).to.equal(15n);
    expect((await credential.credentials(1n)).attested).to.equal(false);
    expect((await credential.credentials(2n)).totalPoints).to.equal(40n);
    expect((await credential.credentials(2n)).easyCorrect).to.equal(5n);
    expect((await credential.credentials(2n)).mediumCorrect).to.equal(5n);

    await credential.connect(learner).mintCredential(18, 3, 5, 1, 0, IMAGE);
    expect(await credential.credentialOf(learner.address)).to.equal(3n);
    expect(await credential.credentialOf(other.address)).to.equal(2n);
    expect((await credential.credentials(2n)).totalPoints).to.equal(40n);
  });
});
