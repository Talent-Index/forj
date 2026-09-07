import { Doodle } from "./Doodle.jsx";

export function DoodleDivider({ type = "divider", size = 48, className = "" } = {}) {
  return (
    <div className={`doodle-divider ${className}`.trim()} aria-hidden="true">
      <Doodle type={type} size={size} variant="muted" />
    </div>
  );
}

export default DoodleDivider;
