import { AchievementHub } from "./achievements/AchievementHub";

/**
 * Progress-page entry: unified Forjora achievement system.
 * Keeps default export path stable for ProgressPage imports.
 */
function Achievements({
  progression,
  sectionScores,
  acquiredPieces = [],
  attempts = [],
  hasCredential = false,
  recipientName,
  onLearn,
  onPuzzle,
  onCredentials,
}) {
  const achievements = progression?.achievements || [];
  const puzzleCount = Array.isArray(acquiredPieces) ? acquiredPieces.length : 0;

  return (
    <AchievementHub
      achievements={achievements}
      progression={{
        ...progression,
        // Ensure certificate evaluation can see quiz scores via hook context
        _sectionScores: sectionScores,
        _attempts: attempts,
      }}
      sectionScores={sectionScores}
      puzzleCount={puzzleCount}
      puzzleComplete={puzzleCount >= 16}
      recipientName={recipientName || "Learner"}
      learnerKey={recipientName || "LOCAL"}
      hasOnChainCredential={hasCredential}
      onLearn={onLearn}
      onPuzzle={onPuzzle}
      onCredentials={onCredentials}
    />
  );
}

export default Achievements;
