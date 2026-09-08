import assert from "node:assert/strict";
import {
  VAULT_FILTERS,
  VAULT_SORTS,
  buildCredentialVault,
  buildVaultItems,
  filterVaultItems,
  selectFeaturedCredential,
  sortVaultItems,
  vaultStats,
} from "../src/utils/credentialVault.js";

assert.ok(VAULT_FILTERS.some((item) => item.id === "claimed"));
assert.ok(VAULT_FILTERS.some((item) => item.id === "attested"));
assert.ok(VAULT_SORTS.some((item) => item.id === "highest"));
assert.ok(
  VAULT_FILTERS.every((item) => !/verified/i.test(item.label)),
  "vault filters must not use verified wording"
);

const empty = buildCredentialVault({
  acquiredPieces: [],
  sectionScores: {},
  progress: { completedTracks: {}, completedPaths: {}, completedQuizzes: {} },
});
assert.equal(empty.stats.credentialsEarned, 0);
assert.ok(empty.items.some((item) => item.kind === "path" && item.state === "locked"));
assert.equal(empty.featured, null);

const pieces = Array.from({ length: 16 }, (_, i) => i);
const ready = buildVaultItems({
  acquiredPieces: pieces,
  puzzleComplete: true,
  progress: { completedTracks: {}, completedPaths: {}, completedQuizzes: {} },
  sectionScores: {},
});
assert.ok(ready.some((item) => item.kind === "path" && item.state === "in-progress"));

const onChain = {
  credentialId: "1",
  score: { totalPoints: 15 },
  walletAddress: `0x${"a".repeat(40)}`,
  attested: false,
};
const minted = buildCredentialVault({
  acquiredPieces: pieces,
  puzzleComplete: true,
  onChainCredential: onChain,
  progress: {
    completedTracks: { fundamentals: true },
    completedPaths: {},
    completedQuizzes: { easy: { perfect: false } },
  },
  sectionScores: { easy: { correct: 5, total: 5, pointsEarned: 15 } },
});
assert.ok(minted.stats.credentialsEarned >= 1);
assert.equal(minted.featured?.kind, "path");
assert.equal(minted.featured?.statusId, "claimed");
assert.equal(minted.stats.claimedCount, 1);
assert.equal(minted.stats.attestedCount, 0);

const attested = buildCredentialVault({
  acquiredPieces: pieces,
  puzzleComplete: true,
  onChainCredential: { ...onChain, attested: true },
});
assert.equal(attested.stats.attestedCount, 1);
assert.equal(selectFeaturedCredential(attested.items)?.statusId, "attested");

const filtered = filterVaultItems(minted.items, "claimed");
assert.ok(filtered.every((item) => item.statusId === "claimed"));
const locked = filterVaultItems(minted.items, "locked");
assert.ok(locked.every((item) => item.state === "locked"));

const sorted = sortVaultItems(minted.items, "highest");
assert.ok(sorted.length > 1);

const stats = vaultStats(minted.items, { acquiredPieces: pieces, puzzleComplete: true });
assert.equal(stats.puzzlePieces, 16);
assert.equal(stats.puzzleComplete, true);

console.log("credential vault tests passed");
