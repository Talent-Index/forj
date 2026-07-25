import { useState, useCallback, useEffect } from "react";
import { createWalletClient, custom, createPublicClient } from "viem";
import { avalancheFuji } from "viem/chains";

const STORAGE_KEY = "skillforge_wallet";

export function useWallet() {
  const [address, setAddress] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const publicClient = window.ethereum
    ? createPublicClient({
        chain: avalancheFuji,
        transport: custom(window.ethereum),
      })
    : null;

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
      await switchToFuji();
      const client = await getWalletClient();
      const [acc] = await client.requestAddresses();
      setAddress(acc);
      localStorage.setItem(STORAGE_KEY, acc);
      const id = publicClient ? await publicClient.getChainId() : null;
      setChainId(id);
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
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
    error,
    connect,
    disconnect,
    getWalletClient,
    publicClient,
    isConnected: !!address,
  };
}
