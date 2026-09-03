import { Icon } from "./ui/Icon";

function EmptyState({
  icon = "info",
  title,
  body,
  actionLabel,
  onAction,
  variant = "empty",
}) {
  return (
    <div className={`empty-state empty-state-${variant}`} role={variant === "error" ? "alert" : "status"}>
      <div className="empty-state-icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </div>
      {title && <h3 className="empty-state-title">{title}</h3>}
      {body && <p className="empty-state-body">{body}</p>}
      {actionLabel && onAction && (
        <button className={`btn ${variant === "error" ? "btn-primary" : "btn-secondary"}`} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
