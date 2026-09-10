# Cloud Functions (trusted XP ledger)

Node 22 ESM package that materializes `xpTransactions` and `leaderboardStanding`
from `progressEvents` + `leaderboardPreferences` using the same progression replay
as the learner app.

Standing is public when `optIn` is true. Clients cannot write these collections.
