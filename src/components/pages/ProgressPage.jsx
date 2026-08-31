import { EMPTY_STATES, PATH_COPY } from "../../utils/onboarding";
import { computeLearnerDashboard, shortAddress, walletExplorerUrl } from "../../utils/learnerStats";
import { FUJI_CHAIN_ID } from "../../utils/wallet";
import { useOnChainCredential } from "../../hooks/useOnChainCredential";
import { getFujiPublicClient } from "../../utils/fujiClient";
import { Button, Card, ProgressBar } from "../ui/primitives";
import EmptyState from "../EmptyState";
import ExistingCertificate from "../ExistingCertificate";
import Achievements from "../Achievements";
import { buildCredentialVerificationView } from "../../utils/credentialLookup";

function ProgressPage({
  address,
  walletName,
  chainId,
  isFuji,
  sectionScores,
  totalPoints,
  spentPoints,
  acquiredPieces,
  attempts,
  publicClient,
  onContinue,
  onLearn,
  onPuzzle,
  onCredentials,
  onLookup,
  progression,
}) {
  const stats = computeLearnerDashboard({
    sectionScores,
    attempts,
    acquiredPieces,
    totalPoints,
    spentPoints,
  });
  const { credential, transactionHash, loading: credentialLoading, error: credentialError } =
    useOnChainCredential(address, publicClient || (address ? getFujiPublicClient() : null));
  const credentialView = credential
    ? buildCredentialVerificationView(credential, { transactionHash })
    : null;
  const next = stats.difficulties.find((row) => row.percent < 100) || stats.difficulties[0];
  const displayAddress = shortAddress(address);
  const explorerUrl = walletExplorerUrl(address);

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Forjora progress</p>
        <h1>Learner dashboard</h1>
        <p className="lede">
          Track quizzes, points, puzzle pieces, and your Fuji credential for this wallet.
        </p>
      </header>

      {stats.isNewLearner && (
        <EmptyState
          title={EMPTY_STATES.noAttempts.title}
          body="Take the Easy quiz to fill this dashboard. Points, puzzle pieces, achievements, and credentials appear after you start learning."
          actionLabel="Start Easy"
          onAction={() => onContinue("easy")}
        />
      )}

      <section className="section-block">
        <h2>Progression</h2>
        <div className="stat-row">
          <Card className="stat-compact">
            <p className="kicker">Level</p>
            <p className="stat-value">{progression?.level?.level ?? 1}</p>
            <p className="meta-line">{progression?.summary?.xp ?? 0} XP · {progression?.level?.xpForNextLevel ?? 0} to next</p>
          </Card>
          <Card className="stat-compact">
            <p className="kicker">Streak</p>
            <p className="stat-value">{progression?.streakCurrent ?? 0}</p>
            <p className="meta-line">Longest {progression?.streakLongest ?? 0} days (UTC)</p>
          </Card>
          <Card className="stat-compact">
            <p className="kicker">Path</p>
            <p className="stat-value">{progression?.path?.percent ?? 0}%</p>
            <p className="meta-line">{progression?.nextItem?.title || "Start the fundamentals track"}</p>
          </Card>
        </div>
        {progression?.level && (
          <ProgressBar label={`Level ${progression.level.level}`} value={progression.level.percent} />
        )}
      </section>

      <section className="section-block">
        <h2>Overall progress</h2>
        <ProgressBar
          label={`Quiz ${stats.quizCorrect}/${stats.quizTotal} · Puzzle ${stats.puzzleCount}/${stats.puzzleTotal}`}
          value={stats.overallPercent}
        />
        <p className="meta-line">{stats.overallPercent}% of quizzes and puzzle</p>
      </section>

      <section className="section-block">
        <h2>Difficulty completion</h2>
        <div className="dashboard-difficulties">
        {stats.difficulties.map((row) => {
          const copy = PATH_COPY[row.id] || { kicker: row.name, title: row.name };
          return (
            <Card key={row.id} className={`difficulty-card difficulty-card-${row.id}`}>
              <p className="kicker">{copy.kicker}</p>
              <h3>{copy.title}</h3>
              <p className="stat-value">{row.percent}%</p>
              <p>
                {row.attempted
                  ? `${row.correct}/${row.total} correct · ${row.pointsEarned} pts`
                  : "Not started"}
              </p>
              <p className="meta-line">
                {row.complete ? "Complete" : row.attempted ? "In progress" : "Not started"}
              </p>
              <Button
                variant={row.attempted ? "secondary" : "primary"}
                onClick={() => onContinue(row.id)}
              >
                {row.attempted ? "Retry" : "Start"}
              </Button>
            </Card>
          );
        })}
        </div>
      </section>

      <section className="section-block">
        <h2>Points</h2>
        <div className="stat-row">
          <Card className="stat-compact">
            <p className="kicker">Total points</p>
            <p className="stat-value">{stats.totalPoints}</p>
            <p className="meta-line">{stats.maxPoints} max from current scores</p>
          </Card>
          <Card className="stat-compact">
            <p className="kicker">Available to spend</p>
            <p className="stat-value">{stats.remainingPoints}</p>
            <p className="meta-line">{stats.spentPoints} spent on pieces</p>
          </Card>
          <Card className="stat-compact">
            <p className="kicker">Puzzle</p>
            <p className="stat-value">{stats.puzzleCount}/{stats.puzzleTotal}</p>
            <p className="meta-line">{stats.puzzlePercent}% complete</p>
          </Card>
        </div>
      </section>

      <section className="section-block">
        <h2>Puzzle completion</h2>
        <ProgressBar label={`${stats.puzzleCount} of ${stats.puzzleTotal} pieces`} value={stats.puzzlePercent} />
        <p>
          {stats.puzzleComplete
            ? "All pieces unlocked. Preview and mint from Credentials."
            : "Spend 5 points per piece. Retries replace quiz scores; they do not stack extra points."}
        </p>
        <Button variant="secondary" onClick={onPuzzle}>Open puzzle</Button>
      </section>

      <ExistingCertificate
        credential={credential}
        view={credentialView}
        loading={credentialLoading}
        error={credentialError}
        walletConnected={Boolean(address)}
        onLookup={onLookup}
        showQr={false}
        actions={<Button variant="secondary" onClick={onCredentials}>Open credentials</Button>}
      />

      <section className="section-block">
        <h2>Learning statistics</h2>
        <div className="stat-row">
          <div>
            <p className="kicker">Attempts</p>
            <p className="stat-value">{stats.attemptCount}</p>
          </div>
          <div>
            <p className="kicker">Accuracy</p>
            <p className="stat-value">{stats.accuracy}%</p>
          </div>
          <div>
            <p className="kicker">Quiz score</p>
            <p className="stat-value">{stats.quizPercent}%</p>
          </div>
        </div>
        <p className="meta-line">
          Attempts · Easy {stats.attemptsBySection.easy} · Medium {stats.attemptsBySection.medium} · Hard {stats.attemptsBySection.hard}
        </p>
        <p className="meta-line">Accuracy uses every saved attempt. Points use your current section scores only.</p>
      </section>

      <section className="section-block">
        <h2>Wallet</h2>
        <p>{displayAddress || "Not connected"}</p>
        <p className="meta-line">
          {walletName || "Wallet"} · {isFuji ? "Avalanche Fuji" : `Chain ${chainId || "unknown"}`} · ID {chainId || FUJI_CHAIN_ID}
        </p>
        {explorerUrl && (
          <p>
            <a href={explorerUrl} target="_blank" rel="noreferrer">
              View address on Snowtrace
            </a>
          </p>
        )}
      </section>

      <section className="section-block">
        <Achievements
          sectionScores={sectionScores}
          acquiredPieces={acquiredPieces}
          attempts={attempts}
          hasCredential={Boolean(credential)}
        />
      </section>

      {!stats.isNewLearner && (
        <div className="quiz-nav quiz-nav-end">
          <Button variant="secondary" onClick={onLearn}>Back to Learn</Button>
          <Button onClick={() => onContinue(next.id)}>
            Continue {PATH_COPY[next?.id]?.kicker || next?.name}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProgressPage;
