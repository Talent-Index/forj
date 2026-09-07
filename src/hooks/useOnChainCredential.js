import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTRACT_ADDRESS,
  CREDENTIAL_ABI,
  FUJI_EXPLORER_TOKEN,
} from "../utils/contract";
import { mapOnChainCredential } from "../utils/credential";
import { findMintTransactionHash } from "../utils/credentialLookup";
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
  const [transactionHash, setTransactionHash] = useState("");
  const [loading, setLoading] = useState(Boolean(CONTRACT_ADDRESS && address && publicClient));
  const [error, setError] = useState(null);
  const hashRequestId = useRef(0);

  const reload = useCallback(async () => {
    if (!CONTRACT_ADDRESS || !publicClient || !address) {
      setCredential(null);
      setTransactionHash("");
      setLoading(false);
      setError(null);
      return null;
    }

    const requestId = ++hashRequestId.current;
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
        if (requestId === hashRequestId.current) {
          setCredential(null);
          setTransactionHash("");
        }
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

      if (requestId !== hashRequestId.current) return next;

      // Paint credential first; mint hash is optional enrichment.
      setCredential(next);
      setLoading(false);

      findMintTransactionHash(publicClient, tokenId)
        .then((hash) => {
          if (requestId !== hashRequestId.current) return;
          setTransactionHash(hash || "");
        })
        .catch(() => {
          if (requestId !== hashRequestId.current) return;
          setTransactionHash("");
        });

      return next;
    } catch (err) {
      if (requestId === hashRequestId.current) {
        setCredential(null);
        setTransactionHash("");
        setError(err?.shortMessage || err?.message || "Could not read credential.");
      }
      return null;
    } finally {
      if (requestId === hashRequestId.current) {
        setLoading(false);
      }
    }
  }, [address, publicClient]);

  useEffect(() => {
    reload();
    return () => {
      hashRequestId.current += 1;
    };
  }, [reload]);

  return { credential, transactionHash, loading, error, reload };
}
