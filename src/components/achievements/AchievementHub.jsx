import { useMemo, useState } from "react";
import EmptyState from "../EmptyState";
import { Button } from "../ui/primitives";
import { BadgeGrid } from "./BadgeGrid";
import { BadgeDetail } from "./BadgeDetail";
import { StreakCard } from "./StreakCard";
import { PuzzleProgress, PuzzleMilestoneList } from "./PuzzleProgress";
import { CertificateCard, CertificateViewer } from "./CertificateViewer";
import { CredentialStatus } from "./CredentialStatus";
import {
  evaluateLearningCertificates,
  highestSkillTiers,
} from "../../utils/achievements";
import { ACHIEVEMENT_FAMILIES, TIER_ROMAN } from "../../utils/achievementCatalog";

/**
 * Unified Forjora achievements hub for the Progress forge page.
 */
export function AchievementHub({
  achievements = [],
  progression,
  sectionScores = {},
  puzzleCount = 0,
  puzzleComplete = false,
  recipientName = "Learner",
  learnerKey = "LOCAL",
  onLearn,
  onPuzzle,
  onCredentials,
  hasOnChainCredential = false,
}) {
  const [selected, setSelected] = useState(null);
  const [familyTab, setFamilyTab] = useState("all");
  const [openCert, setOpenCert] = useState(null);

  const list = useMemo(
    () => (achievements.length ? achievements : []),
    [achievements]
  );

  const certificates = evaluateLearningCertificates({
    completedQuizzes: progression?.state?.completedQuizzes || {},
    sectionScores: sectionScores || {},
    puzzleCount,
    puzzleComplete,
    hasCredential: hasOnChainCredential,
    currentStreak: progression?.streakCurrent || 0,
    longestStreak: progression?.streakLongest || 0,
    completedTracks: progression?.state?.completedTracks || {},
    completedPaths: progression?.state?.completedPaths || {},
    attemptCount: Array.isArray(progression?._attempts)
      ? progression._attempts.length
      : Object.keys(progression?.state?.completedQuizzes || {}).length,
  }, {
    recipientName,
    learnerKey,
  });
  const skillHighlights = useMemo(
    () => highestSkillTiers(list.filter((item) => item.family === "skills")),
    [list]
  );
  const visibleCount = useMemo(
    () => list.filter((item) => !item.hidden || item.earned).length,
    [list]
  );
  const earnedCount = useMemo(
    () => list.filter((item) => item.earned).length,
    [list]
  );
  const filtered = useMemo(
    () => (familyTab === "all" ? list : list.filter((item) => item.family === familyTab)),
    [familyTab, list]
  );

  if (!list.length && !certificates.length) {
    return (
      <div className="achievement-hub">
        <EmptyState
          doodle="badge"
          title="Your badges"
          body="Your achievements will appear here as you learn, build, and prove your skills."
          actionLabel="Explore learning"
          onAction={onLearn}
        />
      </div>
    );
  }

  return (
    <div className="achievement-hub">
      <header className="page-header page-header-nested">
        <p className="kicker">Achievements</p>
        <h2>Forge achievements</h2>
        <p className="lede">
          Badges, streaks, skills, puzzle milestones, and learning certificates — evidence of what you know.
        </p>
        <p className="meta-line">{earnedCount}/{visibleCount} unlocked</p>
      </header>

      <section className="section-block">
        <StreakCard
          current={progression?.streakCurrent || 0}
          longest={progression?.streakLongest || 0}
          progressionState={progression?.state}
        />
      </section>

      <section className="section-block">
        <div className="learn-filters" role="tablist" aria-label="Achievement families">
          <button
            type="button"
            role="tab"
            aria-selected={familyTab === "all"}
            className={`learn-filter ${familyTab === "all" ? "is-active" : ""}`}
            onClick={() => setFamilyTab("all")}
          >
            All
          </button>
          {Object.values(ACHIEVEMENT_FAMILIES).map((family) => (
            <button
              key={family.id}
              type="button"
              role="tab"
              aria-selected={familyTab === family.id}
              className={`learn-filter ${familyTab === family.id ? "is-active" : ""}`}
              onClick={() => setFamilyTab(family.id)}
            >
              {family.label}
            </button>
          ))}
        </div>
        {!filtered.some((item) => item.earned || !item.hidden) ? (
          <EmptyState
            doodle="badge"
            title="No badges in this family yet"
            body="Keep learning — badges unlock from real assessments, streaks, skills, and puzzle progress."
            actionLabel="Explore learning"
            onAction={onLearn}
          />
        ) : (
          <BadgeGrid
            achievements={filtered}
            selectedId={selected?.id}
            onSelect={setSelected}
          />
        )}
      </section>

      {selected ? (
        <section className="section-block">
          <BadgeDetail
            achievement={selected}
            onClose={() => setSelected(null)}
            onContinue={onLearn}
          />
        </section>
      ) : null}

      <section className="section-block">
        <h2>Skills</h2>
        {skillHighlights.length === 0 ? (
          <EmptyState
            doodle="hammer"
            title="No skill badges yet"
            body="Skill ladders unlock as you complete tracks and assessments."
            actionLabel="Explore learning"
            onAction={onLearn}
          />
        ) : (
          <ul className="skill-achievement-list">
            {skillHighlights.map((item) => (
              <li key={item.skillId}>
                <button type="button" className="skill-achievement-chip" onClick={() => setSelected(item)}>
                  <span className="kicker">{item.displayName}</span>
                  <span className="stat-value">
                    {TIER_ROMAN[item.tier]} · {item.tierLabel}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-block">
        <h2>Puzzle</h2>
        <PuzzleProgress
          puzzleCount={puzzleCount}
          complete={puzzleComplete || puzzleCount >= 16}
          onPuzzle={onPuzzle}
        />
        <PuzzleMilestoneList puzzleCount={puzzleCount} />
        {puzzleCount >= 16 ? (
          <p className="lede">
            16 / 16 pieces · Puzzle complete → achievement unlocked → Forjora certificate ready on Credentials.
          </p>
        ) : null}
      </section>

      <section className="section-block">
        <h2>Learning certificates</h2>
        <p className="meta-line">
          Formal path certificates. Separate from Fuji claimed or issuer-attested mints.
        </p>
        <div className="track-cert-grid">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} onOpen={setOpenCert} />
          ))}
        </div>
        {openCert ? (
          <div className="learning-cert-viewer">
            <CertificateViewer
              certificate={openCert}
              recipientName={recipientName}
              onVerify={() => onCredentials?.()}
            />
            {openCert.earned ? (
              <CredentialStatus
                learningRecord
                credentialId={openCert.credentialId}
                issuedLabel={openCert.issuedLabel}
                onVerify={onCredentials}
              />
            ) : null}
            <Button variant="secondary" onClick={() => setOpenCert(null)}>Close certificate</Button>
          </div>
        ) : null}
      </section>

      {!earnedCount ? (
        <EmptyState
          doodle="spark"
          title="Your forge is waiting"
          body="Finish a lesson or Foundation check to earn your first badge."
          actionLabel="Start learning"
          onAction={onLearn}
        />
      ) : null}
    </div>
  );
}

export default AchievementHub;
