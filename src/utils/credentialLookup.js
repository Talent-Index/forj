import { parseAbiItem } from "viem";
import { mapOnChainCredential } from "./credential.js";
import { describeMetadataUri, isCredentialId } from "./credentialModel.js";
import { decodeTokenUri, retrievalUrl, TOKEN_NAME_PREFIX } from "./credentialMetadata.js";
import { EXPLORER_LINK_LABEL, resolveCredentialStatus } from "./credentialStatus.js";
import { highestDifficulty } from "./certificateView.js";
import { shortAddress, walletExplorerUrl } from "./learnerStats.js";
import { normalizeAddress } from "./progress.js";
import { FUJI_CHAIN_ID, networkLabel } from "./wallet.js";
import { CONTRACT_ADDRESS, CREDENTIAL_ABI, FUJI_EXPLORER_TOKEN, FUJI_EXPLORER_TX } from "./contract.js";
import { credentialDeployBlock } from "./fujiClient.js";

export const CREDENTIAL_MINTED_EVENT = parseAbiItem(
  "event CredentialMinted(address indexed learner, uint256 indexed tokenId, uint256 totalPoints, uint256 puzzleMask, bool attested)"
);

export const VERIFICATION_FIELDS = [
  "title",
  "holderWallet",
  "score",
  "difficulty",
  "status",
  "issuer",
  "network",
  "contractAddress",
  "tokenId",
  "transactionHash",
  "explorerUrl",
  "metadataUrl",
];

export const VERIFICATION_LABELS = {
  title: "Credential title",
  holderWallet: "Holder wallet",
  score: "Score",
  difficulty: "Difficulty",
  status: "Credential status",
  issuer: "Issuer",
  network: "Network",
  contractAddress: "Contract address",
  tokenId: "Token ID",
  transactionHash: "Transaction hash",
  explorerUrl: "Explorer link",
  metadataUrl: "Metadata link",
};

export function parseLookupQuery(search = "") {
  const params = new URLSearchParams(
    typeof search === "string" && search.startsWith("?") ? search.slice(1) : String(search || "")
  );
  const tokenRaw = String(params.get("token") || "").trim();
  const wallet = normalizeAddress(params.get("wallet") || "") || "";
  const tokenId = isCredentialId(tokenRaw) ? tokenRaw : "";
  return { tokenId, wallet };
}

export function lookupQueryString({ tokenId = "", wallet = "" } = {}) {
  const params = new URLSearchParams();
  if (isCredentialId(String(tokenId))) params.set("token", String(tokenId));
  const normalized = normalizeAddress(wallet);
  if (normalized) params.set("wallet", normalized);
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export const PUBLIC_CREDENTIAL_PATH = "/credential";

export function parseCredentialLocation(pathname = "/", search = "") {
  const query = parseLookupQuery(search);
  const path = String(pathname || "/").replace(/\/+$/, "") || "/";
  const match = path.match(/^\/credential(?:\/([^/]+))?$/i);
  if (!match) {
    return {
      isPublicRoute: Boolean(query.tokenId || query.wallet),
      tokenId: query.tokenId,
      wallet: query.wallet,
      invalidPathId: false,
    };
  }
  const raw = match[1] ? decodeURIComponent(match[1]) : "";
  const pathTokenId = isCredentialId(raw) ? raw : "";
  return {
    isPublicRoute: true,
    tokenId: pathTokenId || query.tokenId,
    wallet: query.wallet,
    invalidPathId: Boolean(raw) && !pathTokenId && !query.tokenId,
  };
}

export function publicCredentialPath({ tokenId = "", wallet = "" } = {}) {
  const id = isCredentialId(String(tokenId)) ? String(tokenId) : "";
  const path = id ? `${PUBLIC_CREDENTIAL_PATH}/${id}` : PUBLIC_CREDENTIAL_PATH;
  const params = new URLSearchParams();
  const normalized = normalizeAddress(wallet);
  if (normalized) params.set("wallet", normalized);
  const encoded = params.toString();
  return encoded ? `${path}?${encoded}` : path;
}

export function lookupShareUrl({ tokenId = "", wallet = "" } = {}, origin = "") {
  const path = publicCredentialPath({ tokenId, wallet });
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return path;
  return `${String(base).replace(/\/$/, "")}${path}`;
}

function contractAddress() {
  return CONTRACT_ADDRESS || "";
}

async function readOptional(client, request) {
  try {
    return await client.readContract(request);
  } catch {
    return "";
  }
}

export async function findMintTransactionHash(client, tokenId, address = contractAddress()) {
  const id = BigInt(tokenId);
  if (!client || !address || id === 0n) return "";
  try {
    const latest = await client.getBlockNumber();
    const configured = credentialDeployBlock();
    const fromBlock = configured > 0n ? configured : latest > 4_000_000n ? latest - 4_000_000n : 0n;
    const logs = await client.getLogs({
      address,
      event: CREDENTIAL_MINTED_EVENT,
      args: { tokenId: id },
      fromBlock,
      toBlock: "latest",
    });
    const log = logs[logs.length - 1];
    return log?.transactionHash || "";
  } catch {
    return "";
  }
}

export async function loadCredentialByTokenId(client, tokenId, address = contractAddress()) {
  if (!client || !address || !isCredentialId(String(tokenId))) {
    return { credential: null, transactionHash: "", error: "invalid" };
  }
  const id = BigInt(tokenId);
  try {
    const holder = await client.readContract({
      address,
      abi: CREDENTIAL_ABI,
      functionName: "ownerOf",
      args: [id],
    });
    const [data, metadataUri, issuerAddress, chainId] = await Promise.all([
      client.readContract({
        address,
        abi: CREDENTIAL_ABI,
        functionName: "credentials",
        args: [id],
      }),
      readOptional(client, {
        address,
        abi: CREDENTIAL_ABI,
        functionName: "tokenURI",
        args: [id],
      }),
      readOptional(client, {
        address,
        abi: CREDENTIAL_ABI,
        functionName: "owner",
      }),
      typeof client.getChainId === "function" ? client.getChainId() : FUJI_CHAIN_ID,
    ]);
    const credential = mapOnChainCredential(id, data, address, FUJI_EXPLORER_TOKEN, {
      walletAddress: holder,
      metadataUri,
      issuerAddress,
      chainId: Number(chainId) || FUJI_CHAIN_ID,
    });
    if (!credential || !credential.score?.totalPoints) {
      return { credential: null, transactionHash: "", error: "not-found" };
    }
    const transactionHash = await findMintTransactionHash(client, id, address);
    return { credential, transactionHash, error: "" };
  } catch {
    return { credential: null, transactionHash: "", error: "not-found" };
  }
}

export async function loadCredentialByWallet(client, wallet, address = contractAddress()) {
  const holder = normalizeAddress(wallet);
  if (!client || !address || !holder) {
    return { credential: null, transactionHash: "", error: "invalid" };
  }
  try {
    const tokenId = await client.readContract({
      address,
      abi: CREDENTIAL_ABI,
      functionName: "credentialOf",
      args: [holder],
    });
    if (!tokenId || tokenId === 0n) {
      return { credential: null, transactionHash: "", error: "not-found" };
    }
    return loadCredentialByTokenId(client, tokenId.toString(), address);
  } catch {
    return { credential: null, transactionHash: "", error: "not-found" };
  }
}

export async function loadCredentialLookup(client, query, address = contractAddress()) {
  if (!address) return { credential: null, transactionHash: "", error: "no-contract" };
  if (query?.tokenId) {
    const result = await loadCredentialByTokenId(client, query.tokenId, address);
    if (result.credential && query.wallet) {
      const holder = normalizeAddress(result.credential.walletAddress);
      const expected = normalizeAddress(query.wallet);
      if (holder && expected && holder !== expected) {
        return { ...result, error: "owner-mismatch" };
      }
    }
    return result;
  }
  if (query?.wallet) return loadCredentialByWallet(client, query.wallet, address);
  return { credential: null, transactionHash: "", error: "empty" };
}

export function evaluateCredentialVerification(credential, query = {}) {
  if (!credential) {
    return {
      found: false,
      onChain: false,
      ownership: "unknown",
      statusId: "none",
      statusLabel: "Not found",
      summary: "No SkillForge credential exists for this identifier on Fuji.",
    };
  }
  const status = resolveCredentialStatus(credential);
  const holder = normalizeAddress(credential.walletAddress);
  const queried = normalizeAddress(query.wallet);
  const ownership = queried ? (holder && queried === holder ? "match" : "mismatch") : "on-chain";
  const tokenLabel = credential.credentialId ? `#${credential.credentialId}` : "this token";
  let summary = `On-chain record ${tokenLabel} is held by ${shortAddress(holder) || "an unknown wallet"}. Status is ${status.label}.`;
  if (ownership === "match") {
    summary = `On-chain record ${tokenLabel} is held by the wallet in this URL. Status is ${status.label}.`;
  } else if (ownership === "mismatch") {
    summary = `On-chain record ${tokenLabel} exists, but the holder is not the wallet in this URL.`;
  }
  return {
    found: true,
    onChain: true,
    ownership,
    statusId: status.id,
    statusLabel: status.label,
    summary,
  };
}

export function buildCredentialVerificationView(credential, extras = {}) {
  const state = resolveCredentialStatus(credential);
  const tokenId = credential?.credentialId ? String(credential.credentialId) : "";
  const decoded = decodeTokenUri(credential?.metadataUri || "");
  const title = decoded?.name || (tokenId ? `${TOKEN_NAME_PREFIX}${tokenId}` : "");
  const holderWallet = credential?.walletAddress || "";
  const issuerAddress =
    state.id === "attested"
      ? credential?.issuer?.address || ""
      : holderWallet;
  const issuer =
    state.id === "attested"
      ? `Contract owner${issuerAddress ? ` ${shortAddress(issuerAddress)}` : ""}`
      : `Learner (self)${holderWallet ? ` ${shortAddress(holderWallet)}` : ""}`;
  const difficulty = credential?.difficulty
    ? highestDifficulty({
        easy: credential.difficulty.easy,
        medium: credential.difficulty.medium,
        hard: credential.difficulty.hard,
      })
    : "";
  const difficultyDetail = credential?.difficulty
    ? ["easy", "medium", "hard"]
        .map((id) => {
          const row = credential.difficulty[id];
          return `${row?.name || id} ${row?.correct ?? 0}/${row?.total ?? 0}`;
        })
        .join(" · ")
    : "";
  const metadataUri = credential?.metadataUri || "";
  const metadataUrl = retrievalUrl(metadataUri) || metadataUri;
  const transactionHash = extras.transactionHash || credential?.transactionHash || "";
  const verification = evaluateCredentialVerification(credential, extras.query || {});
  const metadata = {
    name: decoded?.name || title,
    description: decoded?.description || "",
    image: decoded?.image || "",
    attributes: Array.isArray(decoded?.attributes) ? decoded.attributes : [],
  };

  return {
    title,
    holderWallet,
    holderWalletShort: shortAddress(holderWallet),
    holderExplorerUrl: walletExplorerUrl(holderWallet),
    score: credential?.score?.totalPoints ?? "",
    scoreLabel: credential?.score ? `${credential.score.totalPoints} pts` : "",
    difficulty,
    difficultyDetail,
    status: state.label,
    statusId: state.id,
    statusBody: state.body,
    issuer,
    issuerAddress,
    network: networkLabel(credential?.chainId || FUJI_CHAIN_ID),
    chainId: credential?.chainId || FUJI_CHAIN_ID,
    contractAddress: credential?.contractAddress || "",
    tokenId,
    transactionHash,
    transactionExplorerUrl: transactionHash ? `${FUJI_EXPLORER_TX}${transactionHash}` : "",
    explorerUrl: credential?.explorerUrl || "",
    explorerLabel: EXPLORER_LINK_LABEL,
    metadataUrl,
    metadataLabel: describeMetadataUri(metadataUri),
    metadata,
    verification,
  };
}
