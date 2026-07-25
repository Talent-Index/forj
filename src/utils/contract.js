import { encodeFunctionData } from "viem";

export const CREDENTIAL_ABI = [
  {
    inputs: [
      { name: "totalPoints", type: "uint256" },
      { name: "puzzleMask", type: "uint256" },
      { name: "easyCorrect", type: "uint8" },
      { name: "mediumCorrect", type: "uint8" },
      { name: "hardCorrect", type: "uint8" },
      { name: "imageData", type: "string" },
    ],
    name: "mintCredential",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "credentialOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "credentials",
    outputs: [
      { name: "totalPoints", type: "uint256" },
      { name: "puzzleMask", type: "uint256" },
      { name: "easyCorrect", type: "uint8" },
      { name: "mediumCorrect", type: "uint8" },
      { name: "hardCorrect", type: "uint8" },
      { name: "mintedAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const CONTRACT_ADDRESS = import.meta.env.VITE_CREDENTIAL_CONTRACT || "";

export function buildMintData({ totalPoints, puzzleMask, easyCorrect, mediumCorrect, hardCorrect, imageData = "" }) {
  return encodeFunctionData({
    abi: CREDENTIAL_ABI,
    functionName: "mintCredential",
    args: [BigInt(totalPoints), BigInt(puzzleMask), easyCorrect, mediumCorrect, hardCorrect, imageData],
  });
}

export function puzzleToMask(acquiredPieces) {
  return acquiredPieces.reduce((mask, index) => mask | (1 << index), 0);
}

export function maskToPieces(mask) {
  const pieces = [];
  for (let i = 0; i < 16; i++) {
    if (mask & (1 << i)) pieces.push(i);
  }
  return pieces;
}
