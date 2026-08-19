/**
 * EIP-712 typed data for SkillForgeCredential.mintCredentialWithAuthorization.
 * Matches the live Fuji typehash. Token IDs are assigned at mint, so credentialId
 * is not in the signed payload.
 */
import { keccak256, stringToHex } from "viem";

export const EIP712_NAME = "SkillForgeCredential";
export const EIP712_VERSION = "1";
export const EIP712_PRIMARY_TYPE = "Credential";

export const EIP712_TYPE_STRING =
  "Credential(address learner,uint256 totalPoints,uint256 puzzleMask,uint8 easyCorrect,uint8 mediumCorrect,uint8 hardCorrect,bytes32 imageHash,uint256 nonce,uint256 deadline)";

export const EIP712_TYPES = {
  [EIP712_PRIMARY_TYPE]: [
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

export function eip712TypeHash() {
  return keccak256(stringToHex(EIP712_TYPE_STRING));
}

export function authorizationDomain({ chainId, verifyingContract }) {
  return {
    name: EIP712_NAME,
    version: EIP712_VERSION,
    chainId,
    verifyingContract,
  };
}

export function imageHashFromUri(imageData) {
  return keccak256(stringToHex(String(imageData ?? "")));
}

export function authorizationMessage({
  learner,
  totalPoints,
  puzzleMask,
  easyCorrect,
  mediumCorrect,
  hardCorrect,
  imageData = "",
  nonce,
  deadline,
}) {
  return {
    learner,
    totalPoints,
    puzzleMask,
    easyCorrect,
    mediumCorrect,
    hardCorrect,
    imageHash: imageHashFromUri(imageData),
    nonce,
    deadline,
  };
}
