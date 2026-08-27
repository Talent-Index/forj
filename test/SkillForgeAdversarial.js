import { expect } from "chai";
import { ethers, provider, deploySkillForgeCredential } from "./network.js";
import {
  EIP712_NAME,
  EIP712_TYPES,
  EIP712_VERSION,
  imageHashFromUri,
} from "../src/utils/eip712Authorization.js";

const IMAGE = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

describe("SkillForgeCredential adversarial", function () {
  async function deployCredential() {
    const deployed = await deploySkillForgeCredential();
    const [, , , stranger] = await ethers.getSigners();
    return { ...deployed, stranger };
  }

  async function domainFor(credential, overrides = {}) {
    const { chainId } = await provider.getNetwork();
    return {
      name: EIP712_NAME,
      version: EIP712_VERSION,
      chainId,
      verifyingContract: await credential.getAddress(),
      ...overrides,
    };
  }

  async function signAttestation(credential, signer, learner, overrides = {}) {
    const latest = (await provider.getBlock("latest")).timestamp;
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

  describe("Unauthorized mint", function () {
    it("does not mint an attested credential without a valid owner signature", async function () {
      const { credential, owner, learner } = await deployCredential();
      const latest = (await provider.getBlock("latest")).timestamp;
      const forged = ethers.hexlify(ethers.randomBytes(65));

      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(
          15,
          1,
          5,
          0,
          0,
          IMAGE,
          BigInt(latest + 3600),
          forged
        )
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.credentialOf(learner.address)).to.equal(0n);
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);

      await credential.connect(owner).mintCredential(15, 1, 5, 0, 0, IMAGE);
      expect((await credential.credentials(1n)).attested).to.equal(false);
    });

    it("cannot mint a credential into another wallet", async function () {
      const { credential, owner, learner, other } = await deployCredential();
      const { value, signature } = await signAttestation(credential, owner, learner);

      await expect(
        credential.connect(other).mintCredentialWithAuthorization(...mintArgs(value, signature))
      ).to.be.revertedWith("Invalid authorization");
      await credential.connect(learner).mintCredential(15, 1, 5, 0, 0, IMAGE);

      expect(await credential.ownerOf(1n)).to.equal(learner.address);
      expect(await credential.credentialOf(other.address)).to.equal(0n);
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
      expect(await credential.authorizationNonces(other.address)).to.equal(0n);
    });
  });

  describe("Forged signature", function () {
    it("rejects a mutated owner signature and a random 65-byte payload", async function () {
      const { credential, owner, learner } = await deployCredential();
      const { value, signature } = await signAttestation(credential, owner, learner);
      const mutated = `${signature.slice(0, 4)}${signature[4] === "a" ? "b" : "a"}${signature.slice(5)}`;
      const randomSig = ethers.hexlify(ethers.randomBytes(65));

      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, mutated))
      ).to.be.revertedWith("Invalid authorization");
      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, randomSig))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
    });

    it("rejects signatures bound to the wrong EIP-712 name or version", async function () {
      const { credential, owner, learner } = await deployCredential();
      const wrongName = await signAttestation(credential, owner, learner, {
        domain: { name: "SkillForge" },
      });
      const wrongVersion = await signAttestation(credential, owner, learner, {
        domain: { version: "2" },
      });

      await expect(
        credential
          .connect(learner)
          .mintCredentialWithAuthorization(...mintArgs(wrongName.value, wrongName.signature))
      ).to.be.revertedWith("Invalid authorization");
      await expect(
        credential
          .connect(learner)
          .mintCredentialWithAuthorization(...mintArgs(wrongVersion.value, wrongVersion.signature))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
    });
  });

  describe("Replayed signature", function () {
    it("rejects a second use of the same authorization", async function () {
      const { credential, owner, learner } = await deployCredential();
      const { value, signature } = await signAttestation(credential, owner, learner);

      await credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature));
      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.authorizationNonces(learner.address)).to.equal(1n);
      expect(await credential.credentialOf(learner.address)).to.equal(1n);
    });

    it("rejects replay after a claimed remint has replaced the attested token", async function () {
      const { credential, owner, learner } = await deployCredential();
      const { value, signature } = await signAttestation(credential, owner, learner);
      await credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature));
      await credential.connect(learner).mintCredential(20, 3, 5, 1, 0, IMAGE);

      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.authorizationNonces(learner.address)).to.equal(1n);
      expect((await credential.credentials(2n)).attested).to.equal(false);
    });
  });

  describe("Wrong nonce", function () {
    it("rejects a future nonce and an already-consumed nonce", async function () {
      const { credential, owner, learner } = await deployCredential();
      const future = await signAttestation(credential, owner, learner, { nonce: 1n });
      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(future.value, future.signature))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);

      const first = await signAttestation(credential, owner, learner, { nonce: 0n });
      await credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(first.value, first.signature));

      const stale = await signAttestation(credential, owner, learner, { nonce: 0n });
      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(stale.value, stale.signature))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.authorizationNonces(learner.address)).to.equal(1n);
    });
  });

  describe("Wrong chain", function () {
    it("rejects a signature bound to Fuji or mainnet while this network differs", async function () {
      const { credential, owner, learner } = await deployCredential();
      const { chainId } = await provider.getNetwork();
      expect(chainId).to.not.equal(43113n);
      expect(chainId).to.not.equal(43114n);

      const fuji = await signAttestation(credential, owner, learner, { domain: { chainId: 43113n } });
      const mainnet = await signAttestation(credential, owner, learner, { domain: { chainId: 43114n } });

      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(fuji.value, fuji.signature))
      ).to.be.revertedWith("Invalid authorization");
      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(mainnet.value, mainnet.signature))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
    });
  });

  describe("Wrong contract", function () {
    it("rejects a signature issued for a different SkillForgeCredential", async function () {
      const { credential, owner, learner } = await deployCredential();
      const otherFactory = await ethers.getContractFactory("SkillForgeCredential");
      const otherContract = await otherFactory.deploy();
      await otherContract.waitForDeployment();
      expect(await otherContract.owner()).to.equal(owner.address);

      const { value, signature } = await signAttestation(otherContract, owner, learner);
      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
      expect(await otherContract.authorizationNonces(learner.address)).to.equal(0n);
    });
  });

  describe("Expired signature", function () {
    it("rejects a deadline of zero and a deadline that has already passed", async function () {
      const { credential, owner, learner } = await deployCredential();
      const zeroDeadline = await signAttestation(credential, owner, learner, { deadline: 0n });
      await expect(
        credential
          .connect(learner)
          .mintCredentialWithAuthorization(...mintArgs(zeroDeadline.value, zeroDeadline.signature))
      ).to.be.revertedWith("Authorization expired");

      const latest = (await provider.getBlock("latest")).timestamp;
      const deadline = BigInt(latest + 4);
      const { value, signature } = await signAttestation(credential, owner, learner, { deadline });
      await provider.send("evm_setNextBlockTimestamp", [Number(deadline) + 1]);

      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(value, signature))
      ).to.be.revertedWith("Authorization expired");
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
    });
  });

  describe("Unauthorized issuer", function () {
    it("rejects a learner, a stranger, and a pending owner as attesting issuer", async function () {
      const { credential, owner, learner, other, stranger } = await deployCredential();

      const selfSigned = await signAttestation(credential, learner, learner);
      await expect(
        credential
          .connect(learner)
          .mintCredentialWithAuthorization(...mintArgs(selfSigned.value, selfSigned.signature))
      ).to.be.revertedWith("Invalid authorization");

      const outsider = await signAttestation(credential, stranger, learner);
      await expect(
        credential
          .connect(learner)
          .mintCredentialWithAuthorization(...mintArgs(outsider.value, outsider.signature))
      ).to.be.revertedWith("Invalid authorization");

      await credential.connect(owner).transferOwnership(other.address);
      const pending = await signAttestation(credential, other, learner);
      await expect(
        credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(pending.value, pending.signature))
      ).to.be.revertedWith("Invalid authorization");
      expect(await credential.owner()).to.equal(owner.address);
      expect(await credential.authorizationNonces(learner.address)).to.equal(0n);
    });
  });

  describe("Unauthorized ownership operation", function () {
    it("rejects transfer, accept, and renounce from accounts that do not hold the issuer role", async function () {
      const { credential, owner, learner, other, stranger } = await deployCredential();

      await expect(
        credential.connect(learner).transferOwnership(other.address)
      ).to.be.revertedWithCustomError(credential, "OwnableUnauthorizedAccount");
      await expect(
        credential.connect(stranger).acceptOwnership()
      ).to.be.revertedWithCustomError(credential, "OwnableUnauthorizedAccount");
      await expect(credential.connect(stranger).renounceOwnership())
        .to.be.revertedWith("Ownership cannot be renounced");

      await credential.connect(owner).transferOwnership(other.address);
      await expect(
        credential.connect(other).transferOwnership(stranger.address)
      ).to.be.revertedWithCustomError(credential, "OwnableUnauthorizedAccount");
      await expect(
        credential.connect(learner).acceptOwnership()
      ).to.be.revertedWithCustomError(credential, "OwnableUnauthorizedAccount");
      await expect(credential.connect(owner).renounceOwnership())
        .to.be.revertedWith("Ownership cannot be renounced");

      expect(await credential.owner()).to.equal(owner.address);
      expect(await credential.pendingOwner()).to.equal(other.address);
    });
  });

  describe("Duplicate credential", function () {
    it("keeps one current credential per wallet and unique token IDs", async function () {
      const { credential, owner, learner, other } = await deployCredential();
      const first = await signAttestation(credential, owner, learner);
      await credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(first.value, first.signature));
      const second = await signAttestation(credential, owner, learner, { nonce: 1n, totalPoints: 40n });
      await credential.connect(learner).mintCredentialWithAuthorization(...mintArgs(second.value, second.signature));

      expect(await credential.credentialOf(learner.address)).to.equal(2n);
      await expect(credential.ownerOf(1n)).to.be.revertedWithCustomError(credential, "ERC721NonexistentToken");
      expect((await credential.credentials(1n)).totalPoints).to.equal(0n);
      expect((await credential.credentials(2n)).totalPoints).to.equal(40n);
      expect((await credential.credentials(2n)).attested).to.equal(true);

      await credential.connect(other).mintCredential(12, 3, 4, 0, 0, IMAGE);
      expect(await credential.credentialOf(other.address)).to.equal(3n);
      expect(await credential.ownerOf(2n)).to.equal(learner.address);
      expect(await credential.ownerOf(3n)).to.equal(other.address);
    });
  });
});
