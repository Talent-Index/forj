import { Doodle } from "./doodles";

const DOODLE_BY_ICON = {
  learn: "book",
  progress: "spark",
  board: "trophy",
  badge: "badge",
  about: "question",
  puzzle: "puzzle",
  flame: "fire",
  path: "arrow",
  check: "check",
  lock: "shield",
  eye: "seal",
  info: "question",
  wallet: "wallet",
};

function EmptyState({
  icon = "info",
  doodle,
  title,
  body,
  actionLabel,
  onAction,
  variant = "empty",
}) {
  const doodleType = doodle || DOODLE_BY_ICON[icon] || "circle";
  return (
    <div className={`empty-state empty-state-${variant}`} role={variant === "error" ? "alert" : "status"}>
      <div className="empty-state-doodle" aria-hidden="true">
        <Doodle type={doodleType} size={28} variant="accent" animated={variant !== "error"} />
      </div>
      {title && <h3 className="empty-state-title">{title}</h3>}
      {body && <p className="empty-state-body">{body}</p>}
      {actionLabel && onAction && (
        <button className={`btn ${variant === "error" ? "btn-primary" : "btn-secondary"}`} onClick={onAction}>
          {actionLabel}
          {variant !== "error" ? <Doodle type="arrow" size={14} variant="muted" /> : null}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
