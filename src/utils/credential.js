import { FUJI_CHAIN_ID } from "./wallet.js";
import { buildCredentialRecord } from "./credentialModel.js";

const DEFAULT_EXPLORER = "https://testnet.snowtrace.io/token/";

function toBigInt(value) {
  try {
    if (typeof value === "bigint") return value;
    if (value == null || value === "") return null;
    return BigInt(value);
  } catch {
    return null;
  }
}

export function mapOnChainCredential(
  tokenId,
  data,
  contractAddress = "",
  explorerBase = DEFAULT_EXPLORER,
  extras = {}
) {
  const id = toBigInt(tokenId);
  if (id == null || id === 0n) return null;
  if (data == null) return null;

  const row = Array.isArray(data)
    ? data
    : [
        data.totalPoints,
        data.puzzleMask,
        data.easyCorrect,
        data.mediumCorrect,
        data.hardCorrect,
        data.image,
        data.mintedAt,
        data.attested,
      ];

  const token = id.toString();
  return buildCredentialRecord({
    tokenId: id,
    totalPoints: row[0],
    puzzleMask: row[1],
    easyCorrect: row[2],
    mediumCorrect: row[3],
    hardCorrect: row[4],
    image: row[5],
    mintedAt: row[6],
    attested: row[7],
    contractAddress,
    chainId: extras.chainId ?? FUJI_CHAIN_ID,
    walletAddress: extras.walletAddress || "",
    metadataUri: extras.metadataUri || "",
    issuerAddress: extras.issuerAddress || "",
    explorerUrl: contractAddress ? `${explorerBase}${contractAddress}?a=${token}` : "",
  });
}
