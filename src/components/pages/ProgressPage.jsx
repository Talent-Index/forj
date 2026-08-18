import { QUESTIONS_PER_QUIZ } from "../../utils/quiz";
import { EMPTY_STATES, PATH_COPY } from "../../utils/onboarding";
import { computeLearnerDashboard, shortAddress } from "../../utils/learnerStats";
import { FUJI_CHAIN_ID } from "../../utils/wallet";
import { useOnChainCredential } from "../../hooks/useOnChainCredential";
import { Button, Card, ProgressBar } from "../ui/primitives";
import EmptyState from "../EmptyState";
import Achievements from "../Achievements";

const SNOWTRACE_ADDRESS = "https://testnet.snowtrace.io/address/";

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
}) {
  const stats = computeLearnerDashboard({
    sectionScores,
    attempts,
    acquiredPieces,
    totalPoints,
    spentPoints,
  });
  const { credential, loading: credentialLoading, error: credentialError } =
    useOnChainCredential(address, publicClient);
  const next = stats.difficulties.find((row) => row.percent < 100) || stats.difficulties[0];

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Progress</p>
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
        <h2>Overall progress</h2>
        <ProgressBar
          label={`Quiz ${stats.quizCorrect}/${stats.quizTotal} · Puzzle ${stats.puzzleCount}/${stats.puzzleTotal}`}
          value={stats.overallPercent}
        />
        <p className="meta-line">{stats.overallPercent}% of the SkillForge loop (quizzes + puzzle)</p>
      </section>

      <section className="section-block">
        <h2>Difficulty completion</h2>
        <div className="dashboard-difficulties">
        {stats.difficulties.map((row) => {
          const copy = PATH_COPY[row.id];
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

      <section className="section-block">
        <h2>Credentials</h2>
        {credentialLoading && <p role="status">Loading credential from Fuji…</p>}
        {!credentialLoading && credential && (
          <>
            <p>
              Token #{credential.tokenId} · {credential.attested ? "Issuer-attested" : "Self-claimed"} · {credential.totalPoints} pts
            </p>
            <p className="meta-line">
              On-chain scores: Easy {credential.easyCorrect}/{QUESTIONS_PER_QUIZ} · Medium {credential.mediumCorrect}/{QUESTIONS_PER_QUIZ} · Hard {credential.hardCorrect}/{QUESTIONS_PER_QUIZ}
            </p>
            <p>
              <a href={credential.explorerUrl} target="_blank" rel="noreferrer">Open on Snowtrace</a>
            </p>
          </>
        )}
        {!credentialLoading && !credential && (
          <EmptyState
            title={EMPTY_STATES.noCredential.title}
            body={credentialError || EMPTY_STATES.noCredential.body}
            actionLabel="Open credentials"
            onAction={onCredentials}
          />
        )}
        {credential && <Button variant="secondary" onClick={onCredentials}>View certificate</Button>}
      </section>

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
        <p>{shortAddress(address) || "Not connected"}</p>
        <p className="meta-line">
          {walletName || "Wallet"} · {isFuji ? "Avalanche Fuji" : `Chain ${chainId || "unknown"}`} · ID {chainId || FUJI_CHAIN_ID}
        </p>
        {address && (
          <p>
            <a href={`${SNOWTRACE_ADDRESS}${address}`} target="_blank" rel="noreferrer">
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
            Continue {PATH_COPY[next.id].kicker}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProgressPage;
