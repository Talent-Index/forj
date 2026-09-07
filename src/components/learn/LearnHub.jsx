import { Button, Card, ProgressBar } from "../ui/primitives";
import { AnimatedDoodle, DoodleText } from "../doodles";
import { LEARN_CATEGORIES } from "../../utils/learningPresentation";

function LearnHub({
  path,
  nextItem,
  trackCards,
  category,
  onCategory,
  onContinue,
  onOpenTrack,
  assessments,
  knowledgeCheck = null,
}) {
  return (
    <div className="page learn-hub">
      <header className="page-header learn-hub-hero">
        <p className="kicker">Learn on Forjora</p>
        <h1>
          <DoodleText trigger="viewport" mark="underline">
            Learn. Build. Prove your skills.
          </DoodleText>
        </h1>
        <p className="lede">
          Follow structured Avalanche tracks, complete practical challenges, forge progress into
          credentials — claimed on Fuji when you are ready.
        </p>
        <div className="learn-hub-doodles" aria-hidden="true">
          <AnimatedDoodle type="book" animation="open" trigger="viewport" size={28} variant="accent" />
          <AnimatedDoodle type="hammer" animation="tap" trigger="viewport" size={24} variant="muted" delay={120} />
          <AnimatedDoodle type="certificate" animation="stamp" trigger="viewport" size={26} variant="accent" delay={240} />
        </div>
      </header>

      {knowledgeCheck ? (
        <section className="section-block path-continue learn-continue">
          <div>
            <p className="kicker">Knowledge check</p>
            <h2>{knowledgeCheck.title}</h2>
            <p className="meta-line">{knowledgeCheck.body}</p>
          </div>
          <div className="learn-continue-actions">
            <Button onClick={knowledgeCheck.onClick}>{knowledgeCheck.cta}</Button>
          </div>
        </section>
      ) : null}
      {nextItem && nextItem.kind !== "none" && (
        <section className="section-block path-continue learn-continue">
          <div>
            <p className="kicker">Continue learning</p>
            <h2>{nextItem.title}</h2>
            {nextItem.reason ? <p className="meta-line">{nextItem.reason}</p> : null}
            {path ? (
              <p className="meta-line">
                {path.name} · {path.completedCount}/{path.totalCount} tracks
              </p>
            ) : null}
          </div>
          <div className="learn-continue-actions">
            <ProgressBar value={path?.percent ?? 0} label="Path" />
            <Button
              disabled={nextItem.locked || nextItem.kind === "complete"}
              onClick={onContinue}
            >
              {nextItem.kind === "complete" ? "Path complete" : "Continue →"}
            </Button>
          </div>
        </section>
      )}

      <section className="section-block">
        <div className="learn-hub-head">
          <h2>Learning tracks</h2>
          <p className="meta-line">Structured journeys from foundations to credential.</p>
        </div>
        <div className="learn-filters" role="tablist" aria-label="Track categories">
          {LEARN_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              className={`learn-filter ${category === item ? "is-active" : ""}`}
              onClick={() => onCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="track-grid learn-track-grid">
          {trackCards.map((card) => (
            <Card
              key={card.id}
              className={`track-card learn-track-card ${card.complete ? "is-complete" : ""} ${card.unlocked ? "" : "is-locked"}`}
            >
              <p className="kicker">{card.difficulty}</p>
              <h3>{card.name}</h3>
              <p className="track-copy">{card.description}</p>
              <p className="meta-line">
                {card.modules} Modules · {card.lessons} Lessons
                {card.challenges ? ` · ${card.challenges} Challenge${card.challenges === 1 ? "" : "s"}` : ""}
              </p>
              <p className="meta-line">{card.durationLabel}</p>
              {card.skills?.length ? (
                <p className="learn-skill-chips">
                  {card.skills.slice(0, 3).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </p>
              ) : null}
              {(card.started || card.complete) && (
                <ProgressBar label={card.complete ? "Complete" : "Progress"} value={card.percent} />
              )}
              <Button
                variant={card.unlocked ? "primary" : "secondary"}
                disabled={!card.unlocked && !card.complete}
                onClick={() => onOpenTrack(card.id)}
              >
                {card.cta} →
              </Button>
            </Card>
          ))}
        </div>
        {trackCards.length === 0 && (
          <p className="meta-line">No tracks in this category yet. Try All or Ecosystems.</p>
        )}
      </section>

      <section className="section-block learn-challenges-block">
        <div className="learn-hub-head">
          <h2>Challenges</h2>
          <p className="meta-line">
            Knowledge checks award XP and puzzle fragments. Seating still uses Easy / Medium / Hard
            points on the Fuji credential scale.
          </p>
        </div>
        {assessments}
      </section>
    </div>
  );
}

export default LearnHub;
