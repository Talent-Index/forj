import assert from "node:assert/strict";
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
assert.equal(unsigned.ok, false);

const named = applyLeaderboardPreference({}, { optIn: true, displayName: "Dana Learner" });
assert.equal(named.ok, true);
assert.equal(named.preference.optIn, true);
assert.deepEqual(
  Object.keys(named.preference).sort(),
  ["displayName", "hideWallet", "optIn"]
);
assert.equal("xp" in named.preference, false);
assert.ok(LEADERBOARD_PREFERENCE_KEYS.includes("displayName"));
assert.equal(LEADERBOARD_PREFERENCE_KEYS.includes("xp"), false);

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
assert.equal(unnamedJoin.ok, false);
assert.equal(unnamedJoin.applied, false);

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

const snap = snapshotFromProgression(replayedAda, { displayName: "Ada" });
assert.equal(snap.authority, LEADERBOARD_AUTHORITY.eventLog);
assert.equal(snap.xp, getXP(replayedAda));

console.log("live leaderboard scoring tests passed");
