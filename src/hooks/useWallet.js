import { useState, useCallback, useEffect, useMemo } from "react";
import { createWalletClient, custom, createPublicClient } from "viem";
import { avalancheFuji } from "viem/chains";
import {
  STORAGE_ADDRESS,
  STORAGE_WALLET_ID,
  WALLET_IDS,
  WALLET_LABELS,
  detectAvailableWallets,
  findProvider,
  formatWalletError,
  identifyProvider,
  isFujiChain,
  isMobileUserAgent,
  parseChainId,
  requestChainId,
  switchOrAddFuji,
  walletDeepLink,
  walletInstallUrl,
} from "../utils/wallet";

function subscribe(provider, event, handler) {
  if (!provider) return () => {};
  if (typeof provider.on === "function") {
    provider.on(event, handler);
    return () => {
      if (typeof provider.removeListener === "function") {
        provider.removeListener(event, handler);
      } else if (typeof provider.off === "function") {
        provider.off(event, handler);
      }
    };
  }
  return () => {};
}

async function waitForInjectedProvider(timeoutMs = 1500) {
  if (typeof window === "undefined") return;
  if (window.ethereum || window.avalanche) return;

  await new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timer);
      window.removeEventListener("ethereum#initialized", finish);
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    window.addEventListener("ethereum#initialized", finish, { once: true });
  });
}

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [available, setAvailable] = useState({ metamask: false, core: false, any: false });

  const isMobile = useMemo(
    () => (typeof navigator === "undefined" ? false : isMobileUserAgent(navigator.userAgent)),
    []
  );

  const refreshAvailability = useCallback(() => {
    if (typeof window === "undefined") return detectAvailableWallets({});
    const next = detectAvailableWallets(window);
    setAvailable(next);
    return next;
  }, []);

  const rememberProvider = useCallback((nextProvider, id) => {
    setProvider(nextProvider || null);
    setWalletId(id || (nextProvider ? identifyProvider(nextProvider) : null));
  }, []);

  const publicClient = useMemo(() => {
    if (!provider) return null;
    return createPublicClient({
      chain: avalancheFuji,
      transport: custom(provider),
    });
  }, [provider]);

  const getWalletClient = useCallback(async () => {
    const nextProvider = provider || findProvider(walletId, window);
    if (!nextProvider) throw new Error("No wallet found. Install MetaMask or Core Wallet.");
    return createWalletClient({
      chain: avalancheFuji,
      transport: custom(nextProvider),
    });
  }, [provider, walletId]);

  const persistSession = useCallback((nextAddress, nextWalletId) => {
    if (nextAddress) localStorage.setItem(STORAGE_ADDRESS, nextAddress);
    else localStorage.removeItem(STORAGE_ADDRESS);
    if (nextWalletId) localStorage.setItem(STORAGE_WALLET_ID, nextWalletId);
    else localStorage.removeItem(STORAGE_WALLET_ID);
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setAddress(null);
    setChainId(null);
    setWalletId(null);
    setError(null);
    persistSession(null, null);
  }, [persistSession]);

  const switchToFuji = useCallback(async () => {
    const nextProvider = provider || findProvider(walletId, window);
    if (!nextProvider) {
      throw new Error("No wallet found. Install MetaMask or Core Wallet.");
    }
    setSwitching(true);
    setError(null);
    try {
      await switchOrAddFuji(nextProvider);
      const nextChainId = await requestChainId(nextProvider);
      setChainId(nextChainId);
      if (!isFujiChain(nextChainId)) {
        throw new Error("Still not on Avalanche Fuji. Switch the network in your wallet, then try again.");
      }
      return nextChainId;
    } catch (err) {
      const message = formatWalletError(err, "switch");
      setError(message);
      throw Object.assign(err instanceof Error ? err : new Error(message), { displayMessage: message });
    } finally {
      setSwitching(false);
    }
  }, [provider, walletId]);

  const connect = useCallback(async (preferredWalletId = null) => {
    setConnecting(true);
    setError(null);
    try {
      await waitForInjectedProvider();
      const detected = refreshAvailability();
      const nextProvider = findProvider(preferredWalletId, window);

      if (!nextProvider) {
        const target = preferredWalletId || WALLET_IDS.metamask;
        if (isMobile) {
          window.location.href = walletDeepLink(target, window.location.href);
          throw new Error(`Opening ${WALLET_LABELS[target]}. Return here after connecting.`);
        }
        throw new Error(
          detected.any
            ? "That wallet is not available in this browser. Choose MetaMask or Core Wallet."
            : "No wallet detected. Install MetaMask or Core Wallet, then refresh this page."
        );
      }

      const selectedId = identifyProvider(nextProvider) || preferredWalletId;
      rememberProvider(nextProvider, selectedId);

      const authorized = await nextProvider.request({ method: "eth_accounts" }).catch(() => []);
      const savedAddress = localStorage.getItem(STORAGE_ADDRESS);
      const known = authorized.find((account) => savedAddress && account.toLowerCase() === savedAddress.toLowerCase())
        || authorized[0];
      const accounts = known
        ? [known]
        : await nextProvider.request({ method: "eth_requestAccounts" });
      const nextAddress = accounts?.[0];
      if (!nextAddress) {
        throw new Error("No account returned. Unlock your wallet and try again.");
      }

      setAddress(nextAddress);
      persistSession(nextAddress, selectedId);

      try {
        await switchOrAddFuji(nextProvider);
      } catch (switchError) {
        const nextChainId = await requestChainId(nextProvider);
        setChainId(nextChainId);
        setError(formatWalletError(switchError, "switch"));
        return;
      }

      const nextChainId = await requestChainId(nextProvider);
      setChainId(nextChainId);
    } catch (err) {
      setError(formatWalletError(err, "connect"));
    } finally {
      setConnecting(false);
    }
  }, [isMobile, persistSession, refreshAvailability, rememberProvider]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        await waitForInjectedProvider();
        if (cancelled) return;
        refreshAvailability();

        const savedAddress = localStorage.getItem(STORAGE_ADDRESS);
        const savedWalletId = localStorage.getItem(STORAGE_WALLET_ID);
        if (!savedAddress) return;

        const nextProvider = findProvider(savedWalletId, window) || findProvider(null, window);
        if (!nextProvider) {
          persistSession(null, null);
          return;
        }

        const accounts = await nextProvider.request({ method: "eth_accounts" });
        const match = accounts.find((account) => account.toLowerCase() === savedAddress.toLowerCase())
          || accounts[0];
        if (!match) {
          persistSession(null, null);
          return;
        }

        if (cancelled) return;
        const selectedId = identifyProvider(nextProvider) || savedWalletId;
        rememberProvider(nextProvider, selectedId);
        setAddress(match);
        persistSession(match, selectedId);
        const nextChainId = await requestChainId(nextProvider);
        if (!cancelled) setChainId(nextChainId);
      } catch {
        persistSession(null, null);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [persistSession, refreshAvailability, rememberProvider]);

  useEffect(() => {
    if (!provider) return undefined;

    const handleAccounts = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
        return;
      }
      setAddress(accounts[0]);
      persistSession(accounts[0], walletId || identifyProvider(provider));
      setError(null);
    };

    const handleChain = (id) => {
      setChainId(parseChainId(id));
      setError(null);
    };

    const handleDisconnect = () => {
      disconnect();
    };

    const unsubAccounts = subscribe(provider, "accountsChanged", handleAccounts);
    const unsubChain = subscribe(provider, "chainChanged", handleChain);
    const unsubDisconnect = subscribe(provider, "disconnect", handleDisconnect);

    return () => {
      unsubAccounts();
      unsubChain();
      unsubDisconnect();
    };
  }, [disconnect, persistSession, provider, walletId]);

  useEffect(() => {
    if (!address || !provider) return undefined;

    async function syncFromWallet() {
      if (!provider?.request) return;
      try {
        const accounts = await provider.request({ method: "eth_accounts" });
        if (!accounts || accounts.length === 0) {
          disconnect();
          return;
        }
        if (accounts[0].toLowerCase() !== address.toLowerCase()) {
          setAddress(accounts[0]);
          persistSession(accounts[0], walletId || identifyProvider(provider));
        }
        const nextChainId = await requestChainId(provider);
        setChainId(nextChainId);
      } catch {
        // Keep the restored session; the next user action will surface a wallet error.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") syncFromWallet();
    };

    window.addEventListener("focus", syncFromWallet);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", syncFromWallet);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [address, disconnect, persistSession, provider, walletId]);

  return {
    address,
    chainId,
    walletId,
    walletName: walletId ? WALLET_LABELS[walletId] : null,
    lastWalletId: walletId || (typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_WALLET_ID)),
    connecting,
    switching,
    restoring,
    error,
    available,
    isMobile,
    connect,
    disconnect,
    getWalletClient,
    publicClient,
    switchToFuji,
    isConnected: !!address,
    isFuji: isFujiChain(chainId),
    installUrl: (id) => walletInstallUrl(id),
    deepLink: (id) => walletDeepLink(id, typeof window === "undefined" ? "" : window.location.href),
  };
}
