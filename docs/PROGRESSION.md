# Progression

Every completed activity should move the learner toward a finished certificate and, if they choose, an on-chain record.

```text
LEARN → PRACTICE → QUIZ → XP + PUZZLE FRAGMENTS → PUZZLE PIECES
  → MASTERY → CAPSTONE → CREDENTIAL
```

Quizzes are knowledge checks inside that loop, not standalone exams. Lengths: Foundation 5, Builder 7, Advanced 10, Mastery 12. First completions award XP and fragments; retries replace scores without farming rewards.

The Learn UI presents this as a structured journey (hub → track path → lesson workspace → challenge → credential), without changing the underlying event model. Learner-facing copy uses **challenge** for knowledge-check CTAs; off-chain path proof is a **learning / track certificate**; the optional Fuji mint is a **claimed credential**.

UI never invents XP or streak by itself. Completions become **progress events**. Those events update path state, XP, achievements, streaks, puzzle history, and (when relevant) credential flags.

## Who the progress belongs to

Progress belongs to the **learner account**, not the wallet.

- Sign in with email or Google. Learn without connecting a wallet.
- Progress follows the account across devices. A browser cache is only a working copy.
- Connect a wallet only to mint or inspect an on-chain credential. A wallet cannot be linked to two accounts at once.
- When a wallet links, any **non-empty** quiz and puzzle snapshot stored for that wallet in this browser replaces the account copy. An empty wallet does not wipe the account. Missing wallet events are copied; events already on the account stay (first write wins).
- Changing wallets does not transfer another account’s XP or puzzle.
- Signing out does not leave the next person with your streak.

## What counts as learning

Counts: finishing a quiz, a lesson, or a module.

Does not count: opening a page, refreshing, clicking repeatedly, or submitting the same quiz again for extra streak or XP.

Streaks use **UTC dates**. One qualifying activity per UTC day (lesson, quiz, challenge — not merely opening the app). Missing a UTC day resets the current streak; the longest streak remains. Milestones include 3, 7, 14, 30, 60, 100, 180, and 365 days.

## XP and levels

XP comes from first-time completions (quiz, lesson, module, track, path, puzzle piece, puzzle complete, selected achievements, streak milestones, claimed credential).

Quiz XP by difficulty: Foundation 100, Builder 175, Advanced 300, Mastery 500 (plus a small perfect-score bonus). A quiz retry still updates **points** (the spendable Easy / Medium / Hard score used for pieces). It does not pay XP or fragments again for that quiz.

**Mastery** is accuracy by assessment level — separate from XP activity — so learners can see Foundation / Builder / Advanced / Mastery understanding beside their level.

Level is a function of total XP. The dashboard shows current level, XP, and XP remaining to the next level.

## Path and tracks

The **Avalanche Developer Path** contains six tracks in order of dependency:

1. Avalanche Fundamentals  
2. Avalanche Architecture  
3. Avalanche L1s  
4. C-Chain & Smart Contracts  
5. Avalanche ICM  
6. Avalanche Developer Track  

Earlier required work unlocks later work. Optional lessons do not block a module. Easy / Medium / Hard quizzes are the credential-seating assessments for Fundamentals, Architecture, and the Developer capstone. Mastery assessments deepen knowledge without changing the frozen Fuji score scale (five counted corrects per Easy / Medium / Hard). Lessons carry deeper Avalanche explanations and official Builder Hub references.

The dashboard’s “next” item is the first unlocked incomplete lesson or quiz on that path.

## Achievements

Badges unlock from the same events: first quiz, perfect score, difficulty completion, Avalanche Explorer (fundamentals track), streak milestones, puzzle piece counts, skill ladders (I–V), first credential, track, and path. Locked badges stay visible unless marked hidden.

Families share one Forjora visual language: Learning, Performance, Puzzle, Streak, Skills, and Credentials. Skill badges progress Explorer → Builder → Practitioner → Specialist → Master without new brand colors.

**Learning certificates** (Foundation → Master) are formal off-chain path records. They are not Fuji soulbound mints and are never described as issuer-attested.

## Puzzle

Sixteen interlocking pieces. Easy seats 3, Medium 5, Hard 8. Each piece has a stable identity, a seat on the board, and a point cost. Quiz points only spend on that quiz’s pieces. Assessments also award **puzzle fragments**; five fragments convert into one seated piece.

Each track also has a **track certificate**. Quiz tracks are achieved when those pieces are seated. Lesson tracks are achieved when the track is complete. Credentials shows track certificates as learning records (in progress or achieved) separately from the path snapshot. Completing all sixteen pieces still reveals the path certificate and continues to naming and the optional claimed mint. Track certificates are not extra on-chain tokens.

## Leaderboard

An opt-in **live board**. Guests can browse without signing in. Verified accounts appear by default, including people who already signed up, at 0 XP under their display name (or Learner if that name cannot be shown). They can hide. They can optionally show a truncated linked wallet. Opted-in learners get a public profile at `/u/:slug`. Order: XP, then path completion, then achievement count, then who unlocked an achievement earlier.

Standing prefers a server-written XP ledger materialized from first-time learning events under security rules. When that ledger is unavailable, the board falls back to replaying the same append-only event log. One completion per allowed source (listed lessons, quiz difficulties including Master, puzzle pieces, credential claim). Quiz retries do not farm XP. Learners cannot write XP totals or rank fields.

It is a **community ranking**, not a tamper-proof exam, not on-chain, and not issuer-attested. The ledger reduces client XP forgery for board totals; it does not make the board an exam or attestation.

## What progression is not

Progression state does not prove an issuer-attested skill. Clients cannot write XP totals, achievements, or attested credentials as raw fields. The live board replays learner-published events; that is still not an attested exam. Credentials, attestations, and issuer signatures need their own authority. See [Credential](./CREDENTIAL.md).
