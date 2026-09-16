import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createWalletClient, custom, createPublicClient } from "viem";
import { avalancheFuji } from "viem/chains";
import {
  STORAGE_ADDRESS,
  STORAGE_WALLET_ID,
  WALLET_IDS,
  WALLET_LABELS,
  clearPendingWalletId,
  detectAvailableWallets,
  findProvider,
  formatWalletError,
  identifyProvider,
  isAllowedWalletId,
  isFujiChain,
  isMobileUserAgent,
  parseChainId,
  readPendingWalletId,
  requestChainId,
  switchOrAddFuji,
  walletDeepLink,
  walletInstallUrl,
  writePendingWalletId,
} from "../utils/wallet";
import { normalizeAddress } from "../utils/progress";

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
  const [info, setInfo] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [available, setAvailable] = useState({ metamask: false, core: false, any: false });
  const resumeAttempted = useRef(false);

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
    const next = normalizeAddress(nextAddress);
    const id = isAllowedWalletId(nextWalletId) ? nextWalletId : null;
    if (next) localStorage.setItem(STORAGE_ADDRESS, next);
    else localStorage.removeItem(STORAGE_ADDRESS);
    if (id) localStorage.setItem(STORAGE_WALLET_ID, id);
    else localStorage.removeItem(STORAGE_WALLET_ID);
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setAddress(null);
    setChainId(null);
    setWalletId(null);
    setError(null);
    setInfo(null);
    clearPendingWalletId();
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

  const connect = useCallback(async (preferredWalletId = null, { resume = false } = {}) => {
    setConnecting(true);
    setError(null);
    if (!resume) setInfo(null);
    try {
      await waitForInjectedProvider(isMobile ? 3200 : 1500);
      const detected = refreshAvailability();
      const nextProvider = findProvider(preferredWalletId, window);

      if (!nextProvider) {
        const target = preferredWalletId || WALLET_IDS.metamask;
        if (isMobile) {
          writePendingWalletId(target);
          setInfo(
            `Opening ${WALLET_LABELS[target]}. Continue inside that wallet's browser to connect and mint.`
          );
          window.location.href = walletDeepLink(target, window.location.href);
          return { opened: true, walletId: target };
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
      const savedAddress = normalizeAddress(localStorage.getItem(STORAGE_ADDRESS));
      const known = authorized.find((account) => savedAddress && normalizeAddress(account) === savedAddress)
        || authorized[0];
      const accounts = known
        ? [known]
        : await nextProvider.request({ method: "eth_requestAccounts" });
      const nextAddress = normalizeAddress(accounts?.[0]);
      if (!nextAddress) {
        throw new Error("No account returned. Unlock your wallet and try again.");
      }

      setAddress(nextAddress);
      persistSession(nextAddress, selectedId);
      clearPendingWalletId();
      setInfo(null);

      try {
        await switchOrAddFuji(nextProvider);
      } catch (switchError) {
        const nextChainId = await requestChainId(nextProvider);
        setChainId(nextChainId);
        setError(formatWalletError(switchError, "switch"));
        return { connected: true, walletId: selectedId };
      }

      const nextChainId = await requestChainId(nextProvider);
      setChainId(nextChainId);
      return { connected: true, walletId: selectedId };
    } catch (err) {
      setError(formatWalletError(err, "connect"));
      return { error: true };
    } finally {
      setConnecting(false);
    }
  }, [isMobile, persistSession, refreshAvailability, rememberProvider]);

  const resumePendingConnect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const pending = readPendingWalletId();
    if (!pending) return;
    await waitForInjectedProvider(isMobile ? 3200 : 1500);
    refreshAvailability();
    const nextProvider = findProvider(pending, window);
    if (!nextProvider) return;
    if (resumeAttempted.current) return;
    resumeAttempted.current = true;
    await connect(pending, { resume: true });
  }, [connect, isMobile, refreshAvailability]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        await waitForInjectedProvider(isMobile ? 3200 : 1500);
        if (cancelled) return;
        refreshAvailability();

        const rawAddress = localStorage.getItem(STORAGE_ADDRESS);
        if (!rawAddress) {
          await resumePendingConnect();
          return;
        }
        const savedAddress = normalizeAddress(rawAddress);
        const savedWalletId = isAllowedWalletId(localStorage.getItem(STORAGE_WALLET_ID))
          ? localStorage.getItem(STORAGE_WALLET_ID)
          : null;
        if (!savedAddress) {
          persistSession(null, null);
          await resumePendingConnect();
          return;
        }

        const nextProvider = findProvider(savedWalletId, window) || findProvider(null, window);
        if (!nextProvider) {
          // Keep the saved address on mobile so Reconnect / Open still has a target.
          if (!isMobile) persistSession(null, null);
          await resumePendingConnect();
          return;
        }

        const accounts = await nextProvider.request({ method: "eth_accounts" });
        const match = accounts.find((account) => account.toLowerCase() === savedAddress.toLowerCase())
          || accounts[0];
        if (!match) {
          if (!isMobile) persistSession(null, null);
          await resumePendingConnect();
          return;
        }

        if (cancelled) return;
        const selectedId = identifyProvider(nextProvider) || savedWalletId;
        rememberProvider(nextProvider, selectedId);
        const restored = normalizeAddress(match);
        if (!restored) {
          persistSession(null, null);
          return;
        }
        setAddress(restored);
        persistSession(restored, selectedId);
        clearPendingWalletId();
        const nextChainId = await requestChainId(nextProvider);
        if (!cancelled) setChainId(nextChainId);
      } catch {
        if (!isMobile) persistSession(null, null);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [isMobile, persistSession, refreshAvailability, rememberProvider, resumePendingConnect]);

  useEffect(() => {
    if (!provider) return undefined;

    const handleAccounts = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
        return;
      }
      const next = normalizeAddress(accounts[0]);
      if (!next) {
        disconnect();
        return;
      }
      setAddress(next);
      persistSession(next, walletId || identifyProvider(provider));
      setError(null);
      setInfo(null);
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
    async function onVisible() {
      if (document.visibilityState !== "visible") return;
      refreshAvailability();
      if (!address) {
        resumeAttempted.current = false;
        await resumePendingConnect();
        return;
      }
      const nextProvider = provider || findProvider(walletId, window);
      if (!nextProvider?.request) return;
      try {
        const accounts = await nextProvider.request({ method: "eth_accounts" });
        if (!accounts || accounts.length === 0) {
          disconnect();
          return;
        }
        if (accounts[0].toLowerCase() !== address.toLowerCase()) {
          const next = normalizeAddress(accounts[0]);
          if (!next) {
            disconnect();
            return;
          }
          setAddress(next);
          persistSession(next, walletId || identifyProvider(nextProvider));
        }
        const nextChainId = await requestChainId(nextProvider);
        setChainId(nextChainId);
      } catch {
        // Keep the restored session; the next user action will surface a wallet error.
      }
    }

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [address, disconnect, persistSession, provider, refreshAvailability, resumePendingConnect, walletId]);

  const lastWalletId = walletId || (typeof localStorage === "undefined"
    ? null
    : (isAllowedWalletId(localStorage.getItem(STORAGE_WALLET_ID))
      ? localStorage.getItem(STORAGE_WALLET_ID)
      : null));

  return {
    address,
    chainId,
    walletId,
    walletName: walletId ? WALLET_LABELS[walletId] : null,
    lastWalletId,
    connecting,
    switching,
    restoring,
    error,
    info,
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
