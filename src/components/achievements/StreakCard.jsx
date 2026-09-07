import { Doodle } from "../doodles";
import { Card, ProgressBar } from "../ui/primitives";
import { getWeeklyActivity } from "../../utils/progression/streaks.js";
import { nextStreakMilestone } from "../../utils/achievementCatalog";

const WEEKDAY = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakCalendar({ week = [] }) {
  return (
    <ol className="streak-calendar" aria-label="Last seven UTC learning days">
      {week.map((day, index) => {
        let label = WEEKDAY[index] || "·";
        if (day.date) {
          try {
            label = new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-US", {
              weekday: "narrow",
              timeZone: "UTC",
            });
          } catch {
            // keep fallback
          }
        }
        return (
          <li key={day.date || index} className={day.active ? "is-active" : ""}>
            <span className="kicker">{label}</span>
            <span className="streak-day-mark" aria-label={day.active ? "Active" : "Missed"}>
              {day.active ? "✓" : "·"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StreakCard({
  current = 0,
  longest = 0,
  progressionState = null,
}) {
  const week = getWeeklyActivity(progressionState);
  const next = nextStreakMilestone(Math.max(current, longest));
  const toward = next ? Math.min(100, Math.round((current / next.days) * 100)) : 100;

  return (
    <Card className="streak-card">
      <div className="streak-card-head">
        <Doodle type="fire" size={22} variant="accent" />
        <div>
          <p className="kicker">Learning streak</p>
          <p className="stat-value">{current} day{current === 1 ? "" : "s"}</p>
        </div>
      </div>
      <p className="meta-line">
        {current > 0
          ? `You've learned for ${current} consecutive UTC day${current === 1 ? "" : "s"}.`
          : "Complete a lesson, quiz, or challenge to start a streak. Opening the app alone does not count."}
      </p>
      <StreakCalendar week={week} />
      <p className="meta-line">Best {longest}</p>
      {next ? (
        <>
          <p className="kicker">Next milestone · {next.name}</p>
          <ProgressBar label={`${next.days} days`} value={toward} />
        </>
      ) : (
        <p className="meta-line">Legendary streak complete.</p>
      )}
    </Card>
  );
}

export default StreakCard;
