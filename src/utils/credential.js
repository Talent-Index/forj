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
  explorerBase = DEFAULT_EXPLORER
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
  return {
    tokenId: token,
    totalPoints: row[0] == null ? "0" : row[0].toString(),
    puzzleMask: row[1] == null ? "0" : row[1].toString(),
    easyCorrect: Number(row[2]) || 0,
    mediumCorrect: Number(row[3]) || 0,
    hardCorrect: Number(row[4]) || 0,
    image: row[5] == null ? "" : String(row[5]),
    mintedAt: Number(row[6]) || 0,
    attested: Boolean(row[7]),
    explorerUrl: contractAddress ? `${explorerBase}${contractAddress}?a=${token}` : "",
  };
}
