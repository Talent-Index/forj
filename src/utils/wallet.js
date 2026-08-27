export const FUJI_CHAIN_ID = 43113;
export const FUJI_CHAIN_HEX = "0xa869";

export const FUJI_NETWORK = {
  chainId: FUJI_CHAIN_HEX,
  chainName: "Avalanche Fuji Testnet",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://testnet.snowtrace.io"],
};

export const WALLET_IDS = {
  metamask: "metamask",
  core: "core",
};

export function isAllowedWalletId(walletId) {
  return walletId === WALLET_IDS.metamask || walletId === WALLET_IDS.core;
}

export const WALLET_LABELS = {
  metamask: "MetaMask",
  core: "Core Wallet",
};

export const STORAGE_ADDRESS = "skillforge_wallet";
export const STORAGE_WALLET_ID = "skillforge_wallet_id";

export function parseChainId(value) {
  if (value == null) return null;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).trim();
  if (!text) return null;
  const parsed = text.startsWith("0x") || text.startsWith("0X")
    ? parseInt(text, 16)
    : Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isFujiChain(chainId) {
  return parseChainId(chainId) === FUJI_CHAIN_ID;
}

export function networkLabel(chainId) {
  const id = parseChainId(chainId);
  if (id === FUJI_CHAIN_ID) return "Avalanche Fuji";
  if (id === 43114) return "Avalanche C-Chain";
  if (id === 1) return "Ethereum";
  if (id == null) return "Unknown network";
  return `Chain ${id}`;
}

export function isCoreProvider(provider) {
  if (!provider) return false;
  return Boolean(provider.isAvalanche || provider.isCore);
}

export function isMetaMaskProvider(provider) {
  if (!provider) return false;
  if (isCoreProvider(provider)) return false;
  if (provider.isCoinbaseWallet || provider.isBraveWallet || provider.isRabby) return false;
  return Boolean(provider.isMetaMask);
}

export function identifyProvider(provider) {
  if (isCoreProvider(provider)) return WALLET_IDS.core;
  if (isMetaMaskProvider(provider)) return WALLET_IDS.metamask;
  return null;
}

export function collectInjectedProviders(globalObj = globalThis) {
  const found = [];
  const ethereum = globalObj.ethereum;
  if (Array.isArray(ethereum?.providers) && ethereum.providers.length > 0) {
    found.push(...ethereum.providers);
  } else if (ethereum) {
    found.push(ethereum);
  }
  if (globalObj.avalanche && !found.includes(globalObj.avalanche)) {
    found.push(globalObj.avalanche);
  }
  return found;
}

export function findProvider(walletId, globalObj = globalThis) {
  const providers = collectInjectedProviders(globalObj);
  if (walletId === WALLET_IDS.core) {
    return providers.find(isCoreProvider) || globalObj.avalanche || null;
  }
  if (walletId === WALLET_IDS.metamask) {
    return providers.find(isMetaMaskProvider) || null;
  }
  return providers.find((provider) => identifyProvider(provider)) || providers[0] || null;
}

export function detectAvailableWallets(globalObj = globalThis) {
  const providers = collectInjectedProviders(globalObj);
  const metamask = providers.some(isMetaMaskProvider);
  const core = providers.some(isCoreProvider) || Boolean(globalObj.avalanche);
  return {
    metamask,
    core,
    any: metamask || core || providers.length > 0,
  };
}

export function isMobileUserAgent(userAgent = "") {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}

export function walletInstallUrl(walletId) {
  if (walletId === WALLET_IDS.core) return "https://core.app/";
  return "https://metamask.io/download/";
}

export function walletDeepLink(walletId, href) {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return walletInstallUrl(walletId);
    }
    if (url.username || url.password) return walletInstallUrl(walletId);
    if (walletId === WALLET_IDS.metamask) {
      return `https://metamask.app.link/dapp/${url.host}${url.pathname}${url.search}`;
    }
    if (walletId === WALLET_IDS.core) {
      return `https://go.core.app/dapp?url=${encodeURIComponent(url.toString())}`;
    }
  } catch {
    return walletInstallUrl(walletId);
  }
  return walletInstallUrl(walletId);
}

export function formatWalletError(err, context = "connect") {
  const code = err?.code ?? err?.data?.originalError?.code;
  if (code === 4001) {
    return context === "switch"
      ? "Network switch was rejected. SkillForge requires Avalanche Fuji."
      : "Connection request was rejected. Approve it in your wallet to continue.";
  }
  if (code === 4100) {
    return "Account not authorized. Please approve the connection request in your wallet.";
  }
  if (code === -32002) {
    return "A wallet request is already pending. Open MetaMask or Core Wallet to continue.";
  }
  if (code === 4902) {
    return "Avalanche Fuji is not in your wallet yet. Approve adding the network, then try again.";
  }
  return err?.shortMessage || err?.message || "Wallet request failed.";
}

export async function requestChainId(provider) {
  if (!provider?.request) return null;
  const value = await provider.request({ method: "eth_chainId" });
  return parseChainId(value);
}

export async function switchOrAddFuji(provider) {
  if (!provider?.request) {
    throw new Error("No wallet found. Install MetaMask or Core Wallet.");
  }
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: FUJI_CHAIN_HEX }],
    });
  } catch (switchError) {
    if (switchError?.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [FUJI_NETWORK],
      });
      return;
    }
    throw switchError;
  }
}
