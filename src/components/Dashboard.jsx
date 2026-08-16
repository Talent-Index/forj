function Dashboard({ attempts, totalPoints, acquiredPieces }) {
  if (attempts.length === 0) {
    return (
      <div className="card">
        <h3 className="dashboard-title">Your Progress Dashboard</h3>
        <p className="dashboard-empty">Complete a quiz to start tracking attempts for this wallet.</p>
      </div>
    );
  }

  const bestPoints = Math.max(...attempts.map((a) => a.pointsEarned ?? 0));

  return (
    <div className="card">
      <h3 className="dashboard-title">Your Progress Dashboard</h3>

      <div className="chart-container">
        {attempts.map((attempt, index) => {
          const pts = attempt.pointsEarned ?? attempt.score ?? 0;
          const height = Math.max(pts * 2, 4);
          const isBest = pts === bestPoints;
          return (
            <div className="chart-bar-wrapper" key={`${attempt.sectionId}-${index}`}>
              <span className="chart-bar-value">{pts}pt</span>
              <div
                className={`chart-bar ${isBest ? "best" : ""}`}
                style={{ height: `${height}px` }}
              />
              <span className="chart-bar-label">{attempt.sectionId || `#${index + 1}`}</span>
            </div>
          );
        })}
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{totalPoints}</div>
          <div className="stat-label">Total Points</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{attempts.length}</div>
          <div className="stat-label">Attempts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧩</div>
          <div className="stat-value">{acquiredPieces.length}/16</div>
          <div className="stat-label">Puzzle Pieces</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
