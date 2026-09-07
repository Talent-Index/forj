import { EMPTY_STATES, PATH_COPY, FORGE_LEVEL_LABELS } from "../../utils/onboarding";
import { computeLearnerDashboard, shortAddress, walletExplorerUrl } from "../../utils/learnerStats";
import { useOnChainCredential } from "../../hooks/useOnChainCredential";
import { getFujiPublicClient } from "../../utils/fujiClient";
import { safeExternalHref } from "../../utils/frontendSecurity";
import { Button, Card, ProgressBar } from "../ui/primitives";
import { Icon } from "../ui/Icon";
import { AnimatedDoodle, Doodle, ForgeSequence } from "../doodles";
import EmptyState from "../EmptyState";
import ExistingCertificate from "../ExistingCertificate";
import Achievements from "../Achievements";
import { buildCredentialVerificationView } from "../../utils/credentialLookup";
import { skillsFromPath } from "../../utils/learningPresentation";

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
        <p className="kicker">Your forge</p>
        <h1>Your Forge</h1>
        <p className="lede">Level, streak, path, and challenge standing — community learning records, not attestation.</p>
      </header>

      {stats.isNewLearner && (
        <EmptyState
          doodle={EMPTY_STATES.noAttempts.doodle}
          title={EMPTY_STATES.noAttempts.title}
          body={EMPTY_STATES.noAttempts.body}
          actionLabel="Start Foundation →"
          onAction={() => onContinue("easy")}
        />
      )}

      <section className="section-block">
        <h2>Standing</h2>
        <div className="stat-row">
          <Card className="stat-compact forge-stat-wrap">
            <span className="forge-stat-doodle" aria-hidden="true">
              <AnimatedDoodle type="hammer" animation="tap" trigger="hover" once={false} size={18} variant="muted" />
            </span>
            <p className="kicker">Level</p>
            <p className="stat-value">{progression?.level?.level ?? 1}</p>
            <p className="meta-line">{progression?.summary?.xp ?? 0} XP</p>
            {progression?.level?.level > 1 ? (
              <ForgeSequence trigger="viewport" size={18} className="forge-level-seq" />
            ) : null}
          </Card>
          <Card className="stat-compact forge-stat-wrap">
            <span className="forge-stat-doodle" aria-hidden="true"><Doodle type="fire" size={18} variant="muted" /></span>
            <p className="kicker">Streak</p>
            <p className="stat-value">{progression?.streakCurrent ?? 0}</p>
            <p className="meta-line">Best {progression?.streakLongest ?? 0}</p>
          </Card>
          <Card className="stat-compact forge-stat-wrap">
            <span className="forge-stat-doodle" aria-hidden="true"><Doodle type="arrow" size={18} variant="muted" /></span>
            <p className="kicker">Path</p>
            <p className="stat-value">{progression?.path?.percent ?? 0}%</p>
            <p className="meta-line">{progression?.nextItem?.title || "Fundamentals"}</p>
          </Card>
        </div>
        {progression?.level && (
          <ProgressBar label={`Level ${progression.level.level}`} value={progression.level.percent} />
        )}
      </section>

      {progression?.nextItem && progression.nextItem.kind !== "none" && (
        <section className="section-block path-continue learn-continue">
          <div>
            <p className="kicker">Continue learning</p>
            <h2>{progression.nextItem.title}</h2>
            {progression.nextItem.reason ? (
              <p className="meta-line">{progression.nextItem.reason}</p>
            ) : null}
          </div>
          <Button
            disabled={progression.nextItem.locked || progression.nextItem.kind === "complete"}
            onClick={() => {
              if (progression.nextItem.kind === "quiz") onContinue(progression.nextItem.id);
              else onLearn?.();
            }}
          >
            Continue →
          </Button>
        </section>
      )}

      <section className="section-block">
        <h2>Skills</h2>
        <p className="meta-line">Track progress as demonstrated skill — not issuer attestation.</p>
        <div className="learn-skills-grid">
          {skillsFromPath(progression?.state).map((row) => (
            <Card key={row.trackId} className="stat-compact">
              <p className="kicker">{row.complete ? "Demonstrated" : "In progress"}</p>
              <h3>{row.name}</h3>
              <ProgressBar value={row.percent} />
              {row.skills?.length ? (
                <p className="meta-line">{row.skills.slice(0, 2).join(" · ")}</p>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2>Challenges</h2>
        <ProgressBar
          label={`Challenges ${stats.quizCorrect}/${stats.quizTotal} · Puzzle ${stats.puzzleCount}/${stats.puzzleTotal}`}
          value={stats.overallPercent}
        />
        <p className="meta-line">{stats.overallPercent}%</p>
      </section>

      <section className="section-block">
        <h2>Levels</h2>
        <div className="dashboard-difficulties">
        {(stats.mastery?.length ? stats.mastery : stats.difficulties).map((row) => {
          const id = row.sectionId || row.id;
          const copy = PATH_COPY[id] || { kicker: id, title: id };
          const attempted = row.attempted ?? false;
          const percent = row.percent || 0;
          const complete = attempted && percent >= 100;
          return (
            <Card key={id} className={`difficulty-card difficulty-card-${id}`}>
              <p className="kicker">{FORGE_LEVEL_LABELS[id] || copy.kicker}</p>
              <h3>{copy.title}</h3>
              <p className="stat-value">{percent}%</p>
              <p>
                {attempted
                  ? `${row.correct}/${row.total} correct${row.pointsEarned != null ? ` · ${row.pointsEarned} pts` : ""}`
                  : "Not started"}
              </p>
              <p className="meta-line">
                {complete ? "Mastered" : attempted ? "Open" : "New"}
              </p>
              <Button
                variant={attempted ? "secondary" : "primary"}
                onClick={() => onContinue(id)}
              >
                {attempted ? "Retry" : "Start"}
              </Button>
            </Card>
          );
        })}
        </div>
        {typeof stats.masteryOverall === "number" ? (
          <p className="meta-line">Overall mastery (Easy–Hard): {stats.masteryOverall}%</p>
        ) : null}
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
            : `5 pts per piece · fragments ${stats.fragments?.towardNext ?? 0}/${stats.fragments?.neededForNext ?? 5} toward next piece.`}
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
            <p className="kicker">Challenge score</p>
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
          progression={progression}
          sectionScores={sectionScores}
          acquiredPieces={acquiredPieces}
          attempts={attempts}
          hasCredential={Boolean(credential)}
          recipientName={progression?.state?.displayName || displayAddress || "Learner"}
          onLearn={onLearn}
          onPuzzle={onPuzzle}
          onCredentials={onCredentials}
        />
      </section>

      {!stats.isNewLearner && (
        <div className="page-actions quiz-nav quiz-nav-end">
          <Button variant="secondary" onClick={onLearn}>Learn</Button>
          <Button onClick={() => onContinue(next.id)}>
            Continue {FORGE_LEVEL_LABELS[next?.id] || PATH_COPY[next?.id]?.kicker || next?.name}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProgressPage;
