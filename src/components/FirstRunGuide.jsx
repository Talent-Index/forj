function FirstRunGuide({ steps, onStartEasy, onDismiss, compact = false }) {
  const next = steps.find((step) => !step.done) || steps[steps.length - 1];

  return (
    <section className={`card first-run-guide ${compact ? "first-run-compact" : ""}`}>
      <div className="first-run-header">
        <h2>Your first SkillForge loop</h2>
        {!compact && (
          <p>
            Follow these steps in order. You can dismiss this once you know the path;
            it will stay hidden for this wallet in this browser.
          </p>
        )}
      </div>
      <ol className="first-run-steps">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`first-run-step ${step.done ? "done" : ""} ${next?.id === step.id ? "current" : ""}`}
          >
            <span className="first-run-marker">{step.done ? "✓" : index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="first-run-actions">
        {onStartEasy && next?.id === "quiz" && (
          <button className="btn-primary" onClick={onStartEasy}>
            Start Easy quiz
          </button>
        )}
        {onDismiss && (
          <button className="btn-secondary" onClick={onDismiss}>
            Hide this guide
          </button>
        )}
      </div>
    </section>
  );
}

export default FirstRunGuide;
