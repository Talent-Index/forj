import { EMPTY_STATES, PATH_COPY } from "../../utils/onboarding";
import { computeLearnerDashboard, shortAddress, walletExplorerUrl } from "../../utils/learnerStats";
import { useOnChainCredential } from "../../hooks/useOnChainCredential";
import { getFujiPublicClient } from "../../utils/fujiClient";
import { safeExternalHref } from "../../utils/frontendSecurity";
import { Button, Card, ProgressBar } from "../ui/primitives";
import { Icon } from "../ui/Icon";
import EmptyState from "../EmptyState";
import ExistingCertificate from "../ExistingCertificate";
import Achievements from "../Achievements";
import { buildCredentialVerificationView } from "../../utils/credentialLookup";

function ProgressPage({
  address,
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
        <h1>Progress</h1>
      </header>

      {stats.isNewLearner && (
        <EmptyState
          title={EMPTY_STATES.noAttempts.title}
          body="Take Easy to fill this page."
          actionLabel="Start Easy"
          onAction={() => onContinue("easy")}
        />
      )}

      <section className="section-block">
        <h2>Standing</h2>
        <div className="stat-row">
          <Card className="stat-compact">
            <p className="kicker"><Icon name="progress" size={14} /> Level</p>
            <p className="stat-value">{progression?.level?.level ?? 1}</p>
            <p className="meta-line">{progression?.summary?.xp ?? 0} XP</p>
          </Card>
          <Card className="stat-compact">
            <p className="kicker"><Icon name="flame" size={14} /> Streak</p>
            <p className="stat-value">{progression?.streakCurrent ?? 0}</p>
            <p className="meta-line">Best {progression?.streakLongest ?? 0}</p>
          </Card>
          <Card className="stat-compact">
            <p className="kicker"><Icon name="path" size={14} /> Path</p>
            <p className="stat-value">{progression?.path?.percent ?? 0}%</p>
            <p className="meta-line">{progression?.nextItem?.title || "Fundamentals"}</p>
          </Card>
        </div>
        {progression?.level && (
          <ProgressBar label={`Level ${progression.level.level}`} value={progression.level.percent} />
        )}
      </section>

      <section className="section-block">
        <h2>Quiz</h2>
        <ProgressBar
          label={`Quiz ${stats.quizCorrect}/${stats.quizTotal} · Puzzle ${stats.puzzleCount}/${stats.puzzleTotal}`}
          value={stats.overallPercent}
        />
        <p className="meta-line">{stats.overallPercent}%</p>
      </section>

      <section className="section-block">
        <h2>Levels</h2>
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
                {row.complete ? "Done" : row.attempted ? "Open" : "New"}
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
            <p className="kicker">Total</p>
            <p className="stat-value">{stats.totalPoints}</p>
            <p className="meta-line">{stats.maxPoints} max</p>
          </Card>
          <Card className="stat-compact">
            <p className="kicker">Spend</p>
            <p className="stat-value">{stats.remainingPoints}</p>
            <p className="meta-line">{stats.spentPoints} spent</p>
          </Card>
          <Card className="stat-compact">
            <p className="kicker"><Icon name="puzzle" size={14} /> Puzzle</p>
            <p className="stat-value">{stats.puzzleCount}/{stats.puzzleTotal}</p>
            <p className="meta-line">{stats.puzzlePercent}% complete</p>
          </Card>
        </div>
      </section>

      <section className="section-block">
        <h2>Puzzle</h2>
        <ProgressBar label={`${stats.puzzleCount} / ${stats.puzzleTotal}`} value={stats.puzzlePercent} />
        <p>
          {stats.puzzleComplete
            ? "Complete. Mint from Credentials."
            : "5 pts per piece. Retries replace scores."}
        </p>
        <Button variant="secondary" onClick={onPuzzle}>Puzzle</Button>
      </section>

      <ExistingCertificate
        credential={credential}
        view={credentialView}
        loading={credentialLoading}
        error={credentialError}
        walletConnected={Boolean(address)}
        onLookup={onLookup}
        showQr={false}
        actions={<Button variant="secondary" onClick={onCredentials}>Credentials</Button>}
      />

      <section className="section-block">
        <h2>Stats</h2>
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
          Easy {stats.attemptsBySection.easy} · Medium {stats.attemptsBySection.medium} · Hard {stats.attemptsBySection.hard}
        </p>
      </section>

      <section className="section-block">
        <h2><Icon name="wallet" size={16} /> Wallet</h2>
        <p>{displayAddress || "Not connected"}</p>
        <p className="meta-line">
          {isFuji ? "Fuji" : `Chain ${chainId || "—"}`}
        </p>
        {safeExternalHref(explorerUrl) && (
          <p>
            <a href={safeExternalHref(explorerUrl)} target="_blank" rel="noopener noreferrer">
              Snowtrace
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
          <Button variant="secondary" onClick={onLearn}>Learn</Button>
          <Button onClick={() => onContinue(next.id)}>
            Continue {PATH_COPY[next?.id]?.kicker || next?.name}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProgressPage;
