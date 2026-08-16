import { useState, useCallback, useEffect, useMemo } from "react";
import { createWalletClient, custom, createPublicClient } from "viem";
import { avalancheFuji } from "viem/chains";

const STORAGE_KEY = "skillforge_wallet";

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState(true);

  const publicClient = useMemo(() => {
    if (!window.ethereum) return null;
    return createPublicClient({
      chain: avalancheFuji,
      transport: custom(window.ethereum),
    });
  }, []);

  const getWalletClient = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet found. Install MetaMask or Core Wallet.");
    return createWalletClient({
      chain: avalancheFuji,
      transport: custom(window.ethereum),
    });
  }, []);

  const switchToFuji = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xa869" }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xa869",
              chainName: "Avalanche Fuji Testnet",
              nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
              rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
              blockExplorerUrls: ["https://testnet.snowtrace.io"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected. Install MetaMask or Avalanche Core Wallet.");
      }

      const client = await getWalletClient();
      const [acc] = await client.requestAddresses();
      setAddress(acc);
      localStorage.setItem(STORAGE_KEY, acc);

      await switchToFuji();

      const id = publicClient ? await publicClient.getChainId() : null;
      setChainId(id);
    } catch (err) {
      if (err.code === 4100) {
        setError("Account not authorized. Please approve the connection request in your wallet.");
      } else if (err.code === 4001) {
        setError("Connection request was rejected. Please approve the request to connect.");
      } else if (err.code === -32002) {
        setError("A connection request is already pending. Please check your wallet.");
      } else {
        setError(err.shortMessage || err.message || "Failed to connect wallet");
      }
    } finally {
      setConnecting(false);
    }
  }, [getWalletClient, publicClient, switchToFuji]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!window.ethereum) {
        if (!cancelled) setRestoring(false);
        return;
      }

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        const match = accounts.find((acc) => acc.toLowerCase() === saved.toLowerCase());
        if (!match) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        if (!cancelled) {
          setAddress(match);
          if (publicClient) {
            const id = await publicClient.getChainId();
            if (!cancelled) setChainId(id);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [publicClient]);

  useEffect(() => {
    if (!window.ethereum || !address) return;

    const handleAccounts = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        localStorage.setItem(STORAGE_KEY, accounts[0]);
      }
    };

    const handleChain = (id) => setChainId(Number(id));

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccounts);
      window.ethereum.removeListener("chainChanged", handleChain);
    };
  }, [address, disconnect]);

  return {
    address,
    chainId,
    connecting,
    restoring,
    error,
    connect,
    disconnect,
    getWalletClient,
    publicClient,
    switchToFuji,
    isConnected: !!address,
  };
}
