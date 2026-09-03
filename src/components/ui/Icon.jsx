const ICONS = {
  home: "M4 11 12 4l8 7v9H4z M9 20v-6h6v6",
  learn: "M4 6.5h10.5V19H4z M14.5 8.5H20V18H8",
  progress: "M5 19V11 M12 19V6 M19 19v-8",
  board: "M5 19V9h4v10z M10.5 19V5h4v14z M16 19v-7h4v7z",
  badge: "M12 3.5 19 7v6.2c0 4-3 6.3-7 8.3-4-2-7-4.3-7-8.3V7z",
  about: "M12 12.5V16 M12 8.2h.01 M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15z",
  profile: "M12 12a3.4 3.4 0 1 0-3.4-3.4A3.4 3.4 0 0 0 12 12z M6.2 19.2a6.4 6.4 0 0 1 11.6 0",
  wallet: "M4 8h16v10H4z M16 12.5h2 M4 8l2.2-3h11.6L20 8",
  puzzle: "M9 4h6v3.2a1.8 1.8 0 1 0 0 3.6V14H12.8a1.8 1.8 0 1 0-3.6 0H6V4h3z",
  flame: "M12 20c3.2 0 5.2-2 5.2-5.2 0-3.4-2.4-5.4-5.2-8.8-2.8 3.4-5.2 5.4-5.2 8.8C6.8 18 8.8 20 12 20z",
  path: "M5 19h4l3-8 3 4h4 M7 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  check: "M5 12.5 10 17.5 19 7",
  lock: "M8 11V8.2a4 4 0 0 1 8 0V11 M7 11h10v9H7z",
  eye: "M3.5 12s3.2-5.5 8.5-5.5S20.5 12 20.5 12 17.3 17.5 12 17.5 3.5 12 3.5 12z M12 14.2A2.2 2.2 0 1 0 12 9.8a2.2 2.2 0 0 0 0 4.4z",
  info: "M12 12.5V16 M12 8.2h.01 M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15z",
  arrow: "M5 12h14 M13 6l6 6-6 6",
};

export function Icon({ name = "info", className = "", size = 18 }) {
  const path = ICONS[name] || ICONS.info;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`ui-icon ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export default Icon;
