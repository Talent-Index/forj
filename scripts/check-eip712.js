import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { keccak256, stringToHex } from "viem";
import {
  EIP712_NAME,
  EIP712_PRIMARY_TYPE,
  EIP712_TYPE_STRING,
  EIP712_TYPES,
  EIP712_VERSION,
  authorizationDomain,
  authorizationMessage,
  eip712TypeHash,
  imageHashFromUri,
} from "../src/utils/eip712Authorization.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sol = readFileSync(join(root, "contracts/SkillForgeCredential.sol"), "utf8");
const docs = readFileSync(join(root, "docs/AUTHORIZATION.md"), "utf8");

assert.equal(EIP712_NAME, "SkillForgeCredential");
assert.equal(EIP712_VERSION, "1");
assert.equal(EIP712_PRIMARY_TYPE, "Credential");
assert.equal(
  EIP712_TYPE_STRING,
  "Credential(address learner,uint256 totalPoints,uint256 puzzleMask,uint8 easyCorrect,uint8 mediumCorrect,uint8 hardCorrect,bytes32 imageHash,uint256 nonce,uint256 deadline)"
);
assert.equal(sol.includes(EIP712_TYPE_STRING), true);
assert.match(sol, /EIP712_NAME = "SkillForgeCredential"/);
assert.match(sol, /EIP712_VERSION = "1"/);
assert.equal(eip712TypeHash(), keccak256(stringToHex(EIP712_TYPE_STRING)));

const fields = EIP712_TYPES.Credential.map((item) => item.name);
assert.deepEqual(fields, [
  "learner",
  "totalPoints",
  "puzzleMask",
  "easyCorrect",
  "mediumCorrect",
  "hardCorrect",
  "imageHash",
  "nonce",
  "deadline",
]);
assert.equal(fields.includes("credentialId"), false);
assert.equal(EIP712_TYPE_STRING.includes("credentialId"), false);

const domain = authorizationDomain({
  chainId: 43113,
  verifyingContract: "0x3756be4955530Bba0844C4D2EcF35DB5ed7d90df",
});
assert.deepEqual(Object.keys(domain), ["name", "version", "chainId", "verifyingContract"]);
assert.equal(domain.name, EIP712_NAME);
assert.equal(domain.version, EIP712_VERSION);
assert.equal(domain.chainId, 43113);

const message = authorizationMessage({
  learner: "0x0000000000000000000000000000000000000001",
  totalPoints: 15n,
  puzzleMask: 1n,
  easyCorrect: 5,
  mediumCorrect: 0,
  hardCorrect: 0,
  imageData: "ipfs://art",
  nonce: 0n,
  deadline: 1n,
});
assert.equal(message.learner, "0x0000000000000000000000000000000000000001");
assert.equal(message.imageHash, imageHashFromUri("ipfs://art"));
assert.notEqual(message.imageHash, imageHashFromUri("ipfs://other"));

assert.match(docs, /name/);
assert.match(docs, /version/);
assert.match(docs, /chainId/);
assert.match(docs, /verifyingContract/);
assert.match(docs, /learner/);
assert.match(docs, /nonce/);
assert.match(docs, /deadline/);
assert.match(docs, /imageHash/);
assert.match(docs, /credentialId.*is \*\*not\*\* signed/);
assert.match(sol, /authorizationNonces\[msg\.sender\] = nonce \+ 1;/);
const consumeAt = sol.indexOf("authorizationNonces[msg.sender] = nonce + 1;");
const mintAt = sol.indexOf("_mintCredential(msg.sender, totalPoints, puzzleMask, easyCorrect, mediumCorrect, hardCorrect, imageData, true);");
assert.equal(consumeAt > 0 && mintAt > consumeAt, true);
assert.match(sol, /Ownable2Step/);
assert.match(sol, /MAX_POINTS = 80/);
assert.match(sol, /MAX_AUTHORIZATION_WINDOW = 7 days/);
assert.match(sol, /_mint\(learner, tokenId\)/);
assert.equal(sol.includes("_safeMint"), false);
assert.match(docs, /seven days/);
assert.match(docs, /per-learner nonce/);

console.log("EIP-712 authorization model tests passed");
