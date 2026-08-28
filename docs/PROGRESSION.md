# Progression

Every completed activity should move the learner toward a finished certificate and, if they choose, an on-chain record.

```text
LEARN → PATH → TRACK → LESSON / QUIZ
  → XP, LEVEL, ACHIEVEMENT, STREAK
  → PUZZLE → CERTIFICATE → CREDENTIAL → LEADERBOARD
```

UI never invents XP or streak by itself. Completions become **progress events**. Those events update path state, XP, achievements, streaks, puzzle history, and (when relevant) credential flags.

## Who the progress belongs to

Progress belongs to the **learner account**, not the wallet.

- Sign in with email or Google. Learn without connecting a wallet.
- Progress follows the account across devices. A browser cache is only a working copy.
- Connect a wallet only to mint or inspect an on-chain credential. A wallet cannot be linked to two accounts at once.
- Changing wallets does not transfer another account’s XP or puzzle.
- Signing out does not leave the next person with your streak.

## What counts as learning

Counts: finishing a quiz, a lesson, or a module.

Does not count: opening a page, refreshing, clicking repeatedly, or submitting the same quiz again for extra streak or XP.

Streaks use **UTC dates**. One qualifying activity per UTC day. Missing a UTC day resets the current streak; the longest streak remains.

## XP and levels

XP comes from first-time completions (quiz, lesson, module, track, path, puzzle piece, puzzle complete, selected achievements, streak milestones, claimed credential).

A quiz retry still updates **points** (the spendable score used for pieces). It does not pay XP again for that quiz.

Level is a function of total XP. The dashboard shows current level, XP, and XP remaining to the next level.

## Path and tracks

The **Avalanche Developer Path** contains six tracks in order of dependency:

1. Avalanche Fundamentals  
2. Avalanche Architecture  
3. Avalanche L1s  
4. C-Chain & Smart Contracts  
5. Avalanche ICM  
6. Avalanche Developer Track  

Earlier required work unlocks later work. Optional lessons do not block a module. Easy / Medium / Hard quizzes are the assessments for Fundamentals, Architecture, and the Developer capstone.

The dashboard’s “next” item is the first unlocked incomplete lesson or quiz on that path.

## Achievements

Badges unlock from the same events: first quiz, perfect score, difficulty completion, Avalanche Explorer (fundamentals track), streak, puzzle, first credential, track, and path. Locked badges stay visible unless marked hidden.

## Puzzle

Sixteen interlocking pieces. Each has a stable identity, a seat on the board, and a point cost. States: locked, available, selected, unlocked, completed.

Rules: no duplicate unlock, no spending below zero, no invented piece ids. Completing all sixteen reveals the certificate and continues to naming and credential.

## Leaderboard

An opt-in **live board** among signed-in learners. New learners are included by default and can hide. Order: XP, then path completion, then achievement count, then who unlocked an achievement earlier.

Standing is derived from an append-only learning event log that learners publish under security rules. One completion per allowed source (listed lessons, quiz difficulties, puzzle pieces, credential claim). Quiz retries do not farm XP. Learners cannot write XP totals or rank fields.

It is a **community ranking**, not a tamper-proof exam ledger, not on-chain, and not issuer-attested. A trusted XP service is still on the roadmap.

## What progression is not

Progression state does not prove an issuer-attested skill. Clients cannot write XP totals, achievements, or attested credentials as raw fields. The live board replays learner-published events; that is still not an attested exam. Credentials, attestations, and issuer signatures need their own authority. See [Credential](./CREDENTIAL.md).
