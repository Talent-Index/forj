import { useCallback, useEffect, useState } from "react";
import {
  CONTRACT_ADDRESS,
  CREDENTIAL_ABI,
  FUJI_EXPLORER_TOKEN,
} from "../utils/contract";

export function useOnChainCredential(address, publicClient) {
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(Boolean(CONTRACT_ADDRESS && address && publicClient));
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!CONTRACT_ADDRESS || !publicClient || !address) {
      setCredential(null);
      setLoading(false);
      setError(null);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const tokenId = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CREDENTIAL_ABI,
        functionName: "credentialOf",
        args: [address],
      });

      if (!tokenId || tokenId === 0n) {
        setCredential(null);
        return null;
      }

      const [data] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CREDENTIAL_ABI,
          functionName: "credentials",
          args: [tokenId],
        }),
      ]);

      const next = {
        tokenId: tokenId.toString(),
        totalPoints: data[0].toString(),
        puzzleMask: data[1].toString(),
        easyCorrect: Number(data[2]),
        mediumCorrect: Number(data[3]),
        hardCorrect: Number(data[4]),
        image: data[5],
        mintedAt: Number(data[6]),
        attested: Boolean(data[7]),
        explorerUrl: `${FUJI_EXPLORER_TOKEN}${CONTRACT_ADDRESS}?a=${tokenId.toString()}`,
      };
      setCredential(next);
      return next;
    } catch (err) {
      setCredential(null);
      setError(err?.shortMessage || err?.message || "Could not read credential.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { credential, loading, error, reload };
}
