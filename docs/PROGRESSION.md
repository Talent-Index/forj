# Progression architecture

SkillForge progression is a single event pipeline. Quizzes, lessons, tracks, XP, achievements, streaks, puzzle unlocks, and credentials all go through `applyProgressEvent`. UI components never write XP or streak fields directly.

```
LEARN → PATH → TRACK → LESSON / QUIZ → XP + LEVEL + ACHIEVEMENT + STREAK
  → PUZZLE PIECE → PUZZLE COMPLETE → CERTIFICATE → CREDENTIAL → LEADERBOARD
```

## Identity

Progression is keyed by the learner account id (`acc_…`), not the wallet. A wallet is optional until an on-chain claim. Switching wallets does not move XP. Signing out loads a different account key. Legacy quiz progress can still be stored against a wallet address; on first load for an account we migrate that snapshot into progression events without double-awarding.

Storage keys:

- Quiz/puzzle: `skillforge.progress.v1.account.<acc_…>` (existing)
- Progression: `skillforge.progression.v2.account.<acc_…>`

## Events

`EVENT_TYPES` in `src/utils/progression/events.js` includes quiz, lesson, module, track, path, activity, achievement, streak, puzzle, and credential events. Unique types use a stable `type:sourceId` id so retries cannot farm XP.

Valid learning activity (streaks): `QUIZ_COMPLETED`, `LESSON_COMPLETED`, `MODULE_COMPLETED`. Page views and duplicate same-UTC-day activity do not increment the streak.

## XP and levels

Configurable in `XP_CONFIG` (`base`, `growth`). Cumulative XP to reach level `n` is the sum of `floor(base * i^growth)` for `i = 1..n-1`. Rewards live in `XP_REWARDS`. `awardXP` / `applyProgressEvent` is the only write path.

Quiz retries still replace **points** via existing scoring. They do not grant a second `QUIZ_COMPLETED` XP packet.

## Achievements

`ACHIEVEMENT_REGISTRY` is event-evaluated after each applied event. The original `evaluateAchievements(quizSnapshot)` helper remains for the legacy 8 badges.

## Streaks

Calendar days are **UTC** (`YYYY-MM-DD` from `Date.toISOString()`). Browser-local midnight is not used for unlocks. Missing a UTC day resets the current streak; longest streak is preserved.

## Paths and tracks

Catalog: `src/data/learning.js`. Engine: `src/utils/progression/paths.js`. Tracks: Fundamentals, Architecture, L1s, C-Chain, ICM, Developer. Quizzes map Easy → fundamentals, Medium → architecture, Hard → developer capstone.

## Puzzle

4×4 interlocking geometry stays in `src/utils/jigsaw.js`. Piece ids are `piece-r{row}-c{col}`. Redemption still uses `redeemPiece` (points). Progression records `PUZZLE_PIECE_UNLOCKED` / `PUZZLE_COMPLETED`. Completing all pieces still reveals the certificate name/preview/credential flow. Claimed vs issuer-attested copy is unchanged.

## Leaderboards

`src/utils/progression/leaderboard.js` is a **local preview**. `LEADERBOARD_AUTHORITY = "local-preview"`. It is not a competitive authority, not on-chain, and not a verified score. Opt-in only. Rank: XP, then path completion, then achievement count, then earlier first achievement.

## Security

Client progression is not authority for credentials, attestations, competitive rank, or token value. EIP-712 mint authorization is unchanged.
