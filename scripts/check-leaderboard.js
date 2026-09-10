import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyProgressEvent, emptyProgression } from "../src/utils/progression/engine.js";
import { EVENT_TYPES } from "../src/utils/progression/events.js";
import {
  LEADERBOARD_AUTHORITY,
  LEADERBOARD_DISCLAIMER,
  LEADERBOARD_PREFERENCE_KEYS,
  applyLeaderboardPreference,
  joinLeaderboardByDefault,
  buildLiveLeaderboard,
  compareLearners,
  mergeAccountRoster,
  rankLearners,
  snapshotFromProgression,
} from "../src/utils/progression/leaderboard.js";
import { replayEvents } from "../src/utils/progression/replay.js";
import { getXP } from "../src/utils/progression/xp.js";
import {
  COLLECTIONS,
  isAllowedProgressEventSource,
  progressEventDocId,
  sanitizeProgressEventSourceId,
} from "../src/utils/backend/schema.js";

assert.match(LEADERBOARD_DISCLAIMER, /not a tamper-proof exam/i);
assert.match(LEADERBOARD_DISCLAIMER, /community ranking/i);
assert.equal(isAllowedProgressEventSource("LESSON_COMPLETED", "fund-what"), true);
assert.equal(isAllowedProgressEventSource("LESSON_COMPLETED", "made-up-lesson"), false);

assert.equal(COLLECTIONS.leaderboardPreferences, "leaderboardPreferences");
assert.equal(sanitizeProgressEventSourceId("piece-3"), "piece-3");
assert.equal(sanitizeProgressEventSourceId("easy!"), "easy_");
assert.equal(
  progressEventDocId("uid1", "QUIZ_COMPLETED", "easy"),
  "uid1_QUIZ_COMPLETED_easy"
);
assert.equal(
  progressEventDocId("uid1", "QUIZ_COMPLETED", "easy"),
  progressEventDocId("uid1", "QUIZ_COMPLETED", "easy")
);

const unsigned = applyLeaderboardPreference({}, { optIn: true, displayName: "" });
assert.equal(unsigned.ok, true);
assert.equal(unsigned.preference.displayName, "Learner");

const numbered = applyLeaderboardPreference({}, { optIn: true, displayName: "Alex 42" });
assert.equal(numbered.ok, true);
assert.equal(numbered.preference.displayName, "Alex 42");

const named = applyLeaderboardPreference({}, { optIn: true, displayName: "Dana Learner" });
assert.equal(named.ok, true);
assert.equal(named.preference.optIn, true);
assert.deepEqual(
  Object.keys(named.preference).sort(),
  ["displayName", "hideWallet", "optIn", "publicSlug", "walletHint"]
);
assert.equal("xp" in named.preference, false);
assert.ok(LEADERBOARD_PREFERENCE_KEYS.includes("displayName"));
assert.ok(LEADERBOARD_PREFERENCE_KEYS.includes("publicSlug"));
assert.ok(LEADERBOARD_PREFERENCE_KEYS.includes("walletHint"));
assert.equal(LEADERBOARD_PREFERENCE_KEYS.includes("xp"), false);

const withWallet = applyLeaderboardPreference({}, {
  optIn: true,
  displayName: "Dana Learner",
  hideWallet: false,
}, {
  userId: "uid123456",
  walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
});
assert.equal(withWallet.preference.hideWallet, false);
assert.match(withWallet.preference.walletHint, /^0x1234/i);
assert.match(withWallet.preference.publicSlug, /dana-learner-uid123/);
assert.equal(LEADERBOARD_AUTHORITY.xpLedger, "xp-ledger");
assert.equal(COLLECTIONS.leaderboardStanding, "leaderboardStanding");

const hidden = applyLeaderboardPreference(named.preference, { optIn: false });
assert.equal(hidden.ok, true);
assert.equal(hidden.preference.optIn, false);

const autoJoin = joinLeaderboardByDefault(null, "Dana Learner");
assert.equal(autoJoin.ok, true);
assert.equal(autoJoin.applied, true);
assert.equal(autoJoin.preference.optIn, true);

const keepHidden = joinLeaderboardByDefault(hidden.preference, "Dana Learner");
assert.equal(keepHidden.applied, false);
assert.equal(keepHidden.preference.optIn, false);

const unnamedJoin = joinLeaderboardByDefault(null, "");
assert.equal(unnamedJoin.ok, true);
assert.equal(unnamedJoin.applied, true);
assert.equal(unnamedJoin.preference.displayName, "Learner");

const rename = joinLeaderboardByDefault(
  { optIn: true, displayName: "Learner", hideWallet: true },
  "Dana Learner"
);
assert.equal(rename.applied, true);
assert.equal(rename.preference.displayName, "Dana Learner");

const roster = mergeAccountRoster(
  [
    { userId: "ada", displayName: "Ada" },
    { userId: "beau", displayName: "Beau", boardVisible: false },
    { userId: "cody", displayName: "Cody" },
    { userId: "dana" },
  ],
  [
    { userId: "ada", optIn: true, displayName: "Ada Prime" },
    { userId: "cody", optIn: false, displayName: "Cody" },
    { userId: "eve", optIn: true, displayName: "Eve" },
  ]
);
assert.equal(roster.find((row) => row.userId === "ada")?.displayName, "Ada Prime");
assert.equal(roster.some((row) => row.userId === "beau"), false);
assert.equal(roster.some((row) => row.userId === "cody"), false);
assert.equal(roster.find((row) => row.userId === "dana")?.displayName, "Learner");
assert.equal(roster.some((row) => row.userId === "eve"), true);
assert.equal(roster.every((row) => row.optIn === true), true);

const unsignedRoster = mergeAccountRoster([{ userId: "old", displayName: "" }], []);
assert.equal(unsignedRoster.length, 1);
assert.equal(unsignedRoster[0].userId, "old");
assert.equal(unsignedRoster[0].displayName, "Learner");

const t0 = Date.UTC(2026, 0, 5, 12);
function complete(state, type, sourceId, timestamp, metadata = {}) {
  return applyProgressEvent(state, {
    type,
    sourceId,
    learnerId: state.learnerId,
    timestamp,
    metadata,
  });
}

let ada = emptyProgression("ada");
ada = complete(ada, EVENT_TYPES.QUIZ_COMPLETED, "easy", t0, {
  difficulty: "easy",
  correct: 5,
  total: 5,
  perfect: true,
}).state;
ada = complete(ada, EVENT_TYPES.LESSON_COMPLETED, "fund-what", t0 + 1).state;

let beau = emptyProgression("beau");
beau = complete(beau, EVENT_TYPES.QUIZ_COMPLETED, "hard", t0, {
  difficulty: "hard",
  correct: 4,
  total: 5,
}).state;

const adaEvents = ada.events.filter((event) => [
  EVENT_TYPES.QUIZ_COMPLETED,
  EVENT_TYPES.LESSON_COMPLETED,
  EVENT_TYPES.QUIZ_STARTED,
  EVENT_TYPES.PUZZLE_PIECE_UNLOCKED,
  EVENT_TYPES.CREDENTIAL_CLAIMED,
].includes(event.type)).map((event) => ({
  ...event,
  userId: "ada",
  clientTimestamp: event.timestamp,
}));
const beauEvents = beau.events.filter((event) => event.type === EVENT_TYPES.QUIZ_COMPLETED).map((event) => ({
  ...event,
  userId: "beau",
  clientTimestamp: event.timestamp,
}));

const replayedAda = replayEvents("ada", adaEvents);
assert.equal(getXP(replayedAda), getXP(ada));
assert.ok(getXP(replayedAda) > 0);

const farm = complete(ada, EVENT_TYPES.QUIZ_COMPLETED, "easy", t0 + 50, {
  difficulty: "easy",
  correct: 5,
  total: 5,
  perfect: true,
});
assert.equal(farm.duplicate, true);
assert.equal(getXP(farm.state), getXP(ada));

const live = buildLiveLeaderboard(
  [
    { userId: "ada", optIn: true, displayName: "Ada" },
    { userId: "beau", optIn: true, displayName: "Beau" },
    { userId: "cody", optIn: false, displayName: "Cody" },
  ],
  [
    ...adaEvents,
    ...beauEvents,
    { userId: "cody", type: EVENT_TYPES.QUIZ_COMPLETED, sourceId: "hard", clientTimestamp: t0, metadata: { difficulty: "hard", correct: 5, total: 5 } },
  ]
);

assert.equal(live.some((row) => row.learnerId === "cody"), false);
assert.equal(live.every((row) => row.authority === LEADERBOARD_AUTHORITY.eventLog), true);
assert.ok(live[0].xp >= live[1].xp);
assert.equal(live.find((row) => row.learnerId === "ada").displayName, "Ada");

const emptyBoard = buildLiveLeaderboard(
  [{ userId: "ada", optIn: true, displayName: "Ada" }],
  []
);
assert.equal(emptyBoard.length, 1);
assert.equal(emptyBoard[0].xp, 0);
assert.equal(emptyBoard[0].rank, 1);

const ranked = rankLearners([
  { learnerId: "a", optIn: true, xp: 100, completionPercent: 40, achievementCount: 2, firstAchievementAt: 50 },
  { learnerId: "b", optIn: true, xp: 100, completionPercent: 80, achievementCount: 1, firstAchievementAt: 10 },
], { window: "global" });
assert.equal(ranked[0].learnerId, "b");
assert.equal(compareLearners(
  { xp: 10, completionPercent: 10, achievementCount: 1, firstAchievementAt: 5 },
  { xp: 10, completionPercent: 10, achievementCount: 1, firstAchievementAt: 1 }
) > 0, true);

const page = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/components/pages/LeaderboardPage.jsx"), "utf8");
assert.match(page, /role="switch"/);
assert.match(page, /Visible as \$\{displayName\}/);
assert.match(page, /Hidden from the board/);
assert.match(page, /Linked wallet shown on the board/);
assert.match(page, /onToggleHideWallet/);
assert.match(page, /Sign in to appear on the live board/);
assert.doesNotMatch(page, /<h2>Privacy<\/h2>/);
assert.doesNotMatch(page, /Show me on the live board/);

const snap = snapshotFromProgression(replayedAda, { displayName: "Ada" });
assert.equal(snap.authority, LEADERBOARD_AUTHORITY.eventLog);
assert.equal(snap.xp, getXP(replayedAda));

const sync = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/utils/backend/leaderboardSync.js"), "utf8");
const firebaseInit = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/firebase.js"), "utf8");
const progressionHook = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/hooks/useProgression.js"), "utf8");
const learner = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/utils/backend/learner.js"), "utf8");
const app = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/App.jsx"), "utf8");
const routes = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/utils/routes.js"), "utf8");
const profilePage = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/components/pages/PublicProfilePage.jsx"), "utf8");
const functionsIndex = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../functions/src/index.js"), "utf8");
const functionsMaterialize = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../functions/src/materializeStanding.js"), "utf8");
const firebaseJson = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../firebase.json"), "utf8"));
assert.match(sync, /export async function fetchLiveLeaderboard/);
assert.match(sync, /optedInStandingQuery/);
assert.match(sync, /buildStandingLeaderboard/);
assert.match(sync, /fetchPublicProfileBySlug/);
assert.doesNotMatch(sync, /getDocs\(collection\(db, COLLECTIONS\.users\)\)/);
assert.match(sync, /mergeAccountRoster/);
assert.match(sync, /getDocs\(optedInPreferenceQuery\(\)\)/);
assert.match(learner, /boardVisible: true/);
assert.match(firebaseInit, /experimentalAutoDetectLongPolling:\s*true/);
assert.match(progressionHook, /await writeLeaderboardPreference\(id, joined.preference/);
assert.match(progressionHook, /pref\.optIn === false/);
assert.match(progressionHook, /needsSlug/);
assert.doesNotMatch(progressionHook, /writeLeaderboardPreference\(id, joined.preference\)\.catch\(\(\) => \{\}\)/);
assert.match(app, /"leaderboard"/);
assert.match(app, /"public-profile"/);
assert.match(app, /PublicProfilePage/);
assert.match(routes, /public-profile/);
assert.match(routes, /\/u\//);
assert.match(profilePage, /Community ranking/);
assert.match(functionsIndex, /onProgressEventWrite/);
assert.match(functionsMaterialize, /leaderboardStanding/);
assert.match(functionsMaterialize, /xpTransactions/);
assert.ok(Array.isArray(firebaseJson.functions));
assert.equal(firebaseJson.functions[0].source, "functions");

console.log("live leaderboard scoring tests passed");
