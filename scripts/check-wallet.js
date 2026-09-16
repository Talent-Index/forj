import assert from "node:assert/strict";
import {
  FUJI_CHAIN_ID,
  WALLET_IDS,
  clearPendingWalletId,
  collectInjectedProviders,
  detectAvailableWallets,
  findProvider,
  formatWalletError,
  identifyProvider,
  isAllowedWalletId,
  isFujiChain,
  isMobileUserAgent,
  networkLabel,
  parseChainId,
  readPendingWalletId,
  walletDeepLink,
  writePendingWalletId,
} from "../src/utils/wallet.js";

assert.equal(parseChainId("0xa869"), FUJI_CHAIN_ID);
assert.equal(parseChainId(43113), FUJI_CHAIN_ID);
assert.equal(parseChainId(43113n), FUJI_CHAIN_ID);
assert.equal(isFujiChain("0xa869"), true);
assert.equal(isFujiChain(1), false);
assert.equal(networkLabel("0xa869"), "Avalanche Fuji");
assert.equal(networkLabel(1), "Ethereum");

const metamask = { isMetaMask: true };
const core = { isAvalanche: true, isMetaMask: true };
assert.equal(identifyProvider(metamask), WALLET_IDS.metamask);
assert.equal(identifyProvider(core), WALLET_IDS.core);

const multi = {
  ethereum: { providers: [metamask, core] },
  avalanche: core,
};
assert.deepEqual(detectAvailableWallets(multi), { metamask: true, core: true, any: true });
assert.equal(findProvider(WALLET_IDS.metamask, multi), metamask);
assert.equal(findProvider(WALLET_IDS.core, multi), core);
assert.equal(collectInjectedProviders({ ethereum: metamask }).length, 1);

assert.match(formatWalletError({ code: 4001 }, "switch"), /Fuji/);
assert.match(formatWalletError({ code: 4001 }, "connect"), /rejected/);
assert.match(formatWalletError({ code: -32002 }), /pending/);

assert.equal(isMobileUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), true);
assert.equal(isMobileUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), false);
assert.match(
  walletDeepLink(WALLET_IDS.metamask, "https://skillforge.example/play"),
  /metamask\.app\.link\/dapp\/skillforge\.example\/play/
);
assert.match(
  walletDeepLink(WALLET_IDS.core, "https://skillforge.example/play?x=1"),
  /go\.core\.app\/dapp\?url=/
);
assert.match(walletDeepLink(WALLET_IDS.metamask, "javascript:alert(1)"), /metamask\.io/);
assert.equal(isMobileUserAgent("Mozilla/5.0 (Linux; Android 14)"), true);
assert.equal(isAllowedWalletId(WALLET_IDS.core), true);
assert.equal(isAllowedWalletId("injected-malware"), false);

const memory = (() => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
})();
writePendingWalletId(WALLET_IDS.metamask, memory);
assert.equal(readPendingWalletId(memory), WALLET_IDS.metamask);
clearPendingWalletId(memory);
assert.equal(readPendingWalletId(memory), null);

console.log("wallet onboarding smoke test passed");
