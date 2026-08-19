import { createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";

const DEFAULT_FUJI_RPC = "https://avalanche-fuji-c-chain.publicnode.com";

export function fujiRpcUrl() {
  try {
    return String(import.meta.env?.VITE_FUJI_RPC_URL || "").trim() || DEFAULT_FUJI_RPC;
  } catch {
    return DEFAULT_FUJI_RPC;
  }
}

export function credentialDeployBlock() {
  try {
    const raw = String(import.meta.env?.VITE_CREDENTIAL_DEPLOY_BLOCK || "").trim();
    if (!raw) return 0n;
    return BigInt(raw);
  } catch {
    return 0n;
  }
}

let client;

export function getFujiPublicClient() {
  if (!client) {
    client = createPublicClient({
      chain: avalancheFuji,
      transport: http(fujiRpcUrl()),
    });
  }
  return client;
}
