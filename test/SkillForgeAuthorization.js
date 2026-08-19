import { expect } from "chai";
import hre from "hardhat";
import {
  EIP712_NAME,
  EIP712_TYPES,
  EIP712_VERSION,
  authorizationDomain,
  imageHashFromUri,
} from "../src/utils/eip712Authorization.js";

const IMAGE = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
const OTHER_IMAGE = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/alt";

describe("SkillForgeCredential EIP-712 authorization", function () {
  async function deployCredential() {
    const [owner, learner, other] = await hre.ethers.getSigners();
    const Credential = await hre.ethers.getContractFactory("SkillForgeCredential");
    const credential = await Credential.deploy();
    await credential.waitForDeployment();
    return { credential, owner, learner, other };
  }

  async function domainFor(credential, overrides = {}) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    return authorizationDomain({
      chainId,
      verifyingContract: await credential.getAddress(),
      ...overrides,
    });
  }

  async function signAttestation(credential, signer, learner, overrides = {}) {
    const latest = (await hre.ethers.provider.getBlock("latest")).timestamp;
    const value = {
      learner: learner.address,
      totalPoints: 15n,
      puzzleMask: 1n,
      easyCorrect: 5,
      mediumCorrect: 0,
      hardCorrect: 0,
      imageHash: imageHashFromUri(IMAGE),
      nonce: 0n,
      deadline: BigInt(latest + 3600),
      ...overrides,
    };
    const domainOverrides = value.domain || {};
    delete value.domain;
    const signature = await signer.signTypedData(
      await domainFor(credential, domainOverrides),
      EIP712_TYPES,
      value
    );
    return { value, signature };
  }

  function mintArgs(value, signature, image = IMAGE) {
    return [
      value.totalPoints,
      value.puzzleMask,
      value.easyCorrect,
      value.mediumCorrect,
      value.hardCorrect,
      image,
      value.deadline,
      signature,
    ];
  }

  it("exposes the finalized EIP-712 domain", async function () {
    const { credential } = await deployCredential();
    const { chainId } = await hre.ethers.provider.getNetwork();
    const domain = await credential.eip712Domain();

    expect(await credential.EIP712_NAME()).to.equal(EIP712_NAME);
    expect(await credential.EIP712_VERSION()).to.equal(EIP712_VERSION);
    expect(domain.name).to.equal(EIP712_NAME);
    expect(domain.version).to.equal(EIP712_VERSION);
    expect(domain.chainId).to.equal(chainId);
    expect(domain.verifyingContract).to.equal(await credential.getAddress());
  });

  it("mints when the issuer, chain, contract, nonce, and deadline are valid", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);

    await expect(credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature)))
      .to.emit(credential, "CredentialMinted")
      .withArgs(learner.address, 1n, 15n, 1n, true);

    expect(await credential.authorizationNonces(learner.address)).to.equal(1n);
    expect((await credential.credentials(1n)).attested).to.equal(true);
    expect(await credential.ownerOf(1n)).to.equal(learner.address);
  });

  it("reverts for the wrong signer and does not consume the nonce", async function () {
    const { credential, learner, other } = await deployCredential();
    const { value, signature } = await signAttestation(credential, other, learner);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("reverts for a signature bound to the wrong chain", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner, {
      domain: { chainId: 43113n },
    });

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("reverts for a signature bound to another contract", async function () {
    const { credential, owner, learner } = await deployCredential();
    const otherContract = await (await hre.ethers.getContractFactory("SkillForgeCredential")).deploy();
    await otherContract.waitForDeployment();
    const { value, signature } = await signAttestation(otherContract, owner, learner);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("accepts the first authorization and rejects reuse", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);

    await credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature));
    expect(await credential.authorizationNonces(learner.address)).to.equal(1n);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(1n);
  });

  it("reverts when the nonce in the signature was already consumed", async function () {
    const { credential, owner, learner } = await deployCredential();
    const first = await signAttestation(credential, owner, learner);
    await credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(first.value, first.signature));

    const replayedNonce = await signAttestation(credential, owner, learner, { nonce: 0n });
    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        ...mintArgs(replayedNonce.value, replayedNonce.signature)
      )
    ).to.be.revertedWith("Invalid authorization");
  });

  it("allows deadline equal to the current timestamp", async function () {
    const { credential, owner, learner } = await deployCredential();
    const latest = (await hre.ethers.provider.getBlock("latest")).timestamp;
    const deadline = BigInt(latest + 8);
    const { value, signature } = await signAttestation(credential, owner, learner, { deadline });
    await hre.network.provider.send("evm_setNextBlockTimestamp", [Number(deadline)]);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
    ).to.emit(credential, "CredentialMinted");
  });

  it("reverts when the deadline is in the past", async function () {
    const { credential, owner, learner } = await deployCredential();
    const latest = (await hre.ethers.provider.getBlock("latest")).timestamp;
    const deadline = BigInt(latest + 4);
    const { value, signature } = await signAttestation(credential, owner, learner, { deadline });
    await hre.network.provider.send("evm_setNextBlockTimestamp", [Number(deadline) + 1]);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
    ).to.be.revertedWith("Authorization expired");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("reverts malformed signature lengths without consuming a nonce", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, "0x"))
    ).to.be.revertedWith("Invalid authorization");
    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature.slice(0, 130)))
    ).to.be.revertedWith("Invalid authorization");
    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, `${signature}aa`))
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("reverts invalid signature values without consuming a nonce", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);
    const highS = `${signature.slice(0, 66)}${"ff".repeat(32)}${signature.slice(130)}`;
    const badV = `${signature.slice(0, 130)}00`;

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, highS))
    ).to.be.revertedWith("Invalid authorization");
    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, badV))
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("reverts when a different recipient submits the authorization", async function () {
    const { credential, owner, learner, other } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);

    await expect(
      credential.connect(other).mintCredentialWithAuthorization(...mintArgs(value, signature))
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
    expect(await credential.authorizationNonces(other.address)).to.equal(0n);
  });

  it("reverts when credential fields do not match the signed payload", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner);

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        value.totalPoints + 1n,
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
        ...mintArgs({ ...value, easyCorrect: 4 }, signature)
      )
    ).to.be.revertedWith("Invalid authorization");

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(
        ...mintArgs(value, signature, OTHER_IMAGE)
      )
    ).to.be.revertedWith("Invalid authorization");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });

  it("does not consume a nonce when attested mint inputs are invalid", async function () {
    const { credential, owner, learner } = await deployCredential();
    const { value, signature } = await signAttestation(credential, owner, learner, {
      totalPoints: 0n,
      puzzleMask: 1n,
    });

    await expect(
      credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
    ).to.be.revertedWith("No points earned");
    expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
  });
});
