const ACHIEVEMENTS = [
  {
    id: "first",
    icon: "🎉",
    name: "First Steps",
    desc: "Complete your first Avalanche quiz",
    check: (data) => Object.keys(data.sectionScores).length >= 1,
  },
  {
    id: "easy_master",
    icon: "🟢",
    name: "Easy Master",
    desc: "Score 5/5 on Easy mode",
    check: (data) => data.sectionScores.easy?.correct === 5,
  },
  {
    id: "medium_master",
    icon: "🟡",
    name: "Subnet Scholar",
    desc: "Score 5/5 on Medium mode",
    check: (data) => data.sectionScores.medium?.correct === 5,
  },
  {
    id: "hard_master",
    icon: "🔴",
    name: "Avalanche Expert",
    desc: "Score 5/5 on Hard mode",
    check: (data) => data.sectionScores.hard?.correct === 5,
  },
  {
    id: "puzzle_starter",
    icon: "🧩",
    name: "Puzzle Starter",
    desc: "Acquire at least 4 puzzle pieces",
    check: (data) => data.acquiredPieces.length >= 4,
  },
  {
    id: "full_puzzle",
    icon: "💎",
    name: "Complete Puzzle",
    desc: "Acquire all 16 puzzle pieces",
    check: (data) => data.acquiredPieces.length >= 16,
  },
];

function Achievements({ sectionScores, acquiredPieces, attempts }) {
  const data = { sectionScores, acquiredPieces, attempts };

  return (
    <div className="card">
      <h3 className="achievements-title">🏅 Achievements & Badges</h3>
      <div className="achievements-grid">
        {ACHIEVEMENTS.map((ach) => {
          const earned = ach.check(data);
          return (
            <div
              key={ach.id}
              className={`achievement-item ${earned ? "earned" : "locked"}`}
              title={ach.desc}
            >
              <span className="ach-icon">{ach.icon}</span>
              <span className="ach-name">{ach.name}</span>
              <span className="ach-status">{earned ? "✅ Earned" : "🔒 Locked"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Achievements;
