import { createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";
import { parseDeployBlock, parseFujiRpcUrl, readPublicEnv } from "./frontendSecurity.js";

export function fujiRpcUrl() {
  return parseFujiRpcUrl(readPublicEnv("VITE_FUJI_RPC_URL"));
}

export function credentialDeployBlock() {
  return parseDeployBlock(readPublicEnv("VITE_CREDENTIAL_DEPLOY_BLOCK"));
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
