import { useCallback, useEffect, useState } from "react";
import {
  CONTRACT_ADDRESS,
  CREDENTIAL_ABI,
  FUJI_EXPLORER_TOKEN,
} from "../utils/contract";
import { mapOnChainCredential } from "../utils/credential";
import { FUJI_CHAIN_ID } from "../utils/wallet";

async function readChainId(publicClient) {
  try {
    if (typeof publicClient.getChainId === "function") {
      return await publicClient.getChainId();
    }
  } catch {
    // Use Fuji when the client cannot report a chain.
  }
  return FUJI_CHAIN_ID;
}

async function readOptional(publicClient, request) {
  try {
    return await publicClient.readContract(request);
  } catch {
    return "";
  }
}

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

      const [data, metadataUri, issuerAddress, chainId] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CREDENTIAL_ABI,
          functionName: "credentials",
          args: [tokenId],
        }),
        readOptional(publicClient, {
          address: CONTRACT_ADDRESS,
          abi: CREDENTIAL_ABI,
          functionName: "tokenURI",
          args: [tokenId],
        }),
        readOptional(publicClient, {
          address: CONTRACT_ADDRESS,
          abi: CREDENTIAL_ABI,
          functionName: "owner",
        }),
        readChainId(publicClient),
      ]);

      const next = mapOnChainCredential(
        tokenId,
        data,
        CONTRACT_ADDRESS,
        FUJI_EXPLORER_TOKEN,
        {
          walletAddress: address,
          metadataUri,
          issuerAddress,
          chainId: Number(chainId) || FUJI_CHAIN_ID,
        }
      );
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
