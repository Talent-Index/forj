import assert from "node:assert/strict";
import {
  FUJI_CHAIN_ID,
  WALLET_IDS,
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
  walletDeepLink,
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
assert.match(walletDeepLink(WALLET_IDS.metamask, "javascript:alert(1)"), /metamask\.io/);
assert.equal(isAllowedWalletId(WALLET_IDS.core), true);
assert.equal(isAllowedWalletId("injected-malware"), false);

console.log("wallet onboarding smoke test passed");
