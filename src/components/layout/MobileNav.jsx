import { Icon } from "../ui/Icon";

const LOGGED_OUT_MOBILE = [
  { id: "landing", label: "Home", icon: "home" },
  { id: "learn", label: "Learn", icon: "learn" },
  { id: "credentials", label: "Creds", icon: "badge" },
  { id: "about", label: "About", icon: "about" },
];

const LOGGED_IN_MOBILE = [
  { id: "learn", label: "Learn", icon: "learn" },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "leaderboard", label: "Board", icon: "board" },
  { id: "credentials", label: "Creds", icon: "badge" },
];

function MobileNav({ page, onNavigate, isAuthenticated }) {
  const items = isAuthenticated ? LOGGED_IN_MOBILE : LOGGED_OUT_MOBILE;

  return (
    <nav className="mobile-nav" aria-label="Mobile">
      {items.map((item) => (
        <button
          key={item.id}
          className={`mobile-nav-item ${page === item.id ? "is-active" : ""}`}
          onClick={() => onNavigate(item.id)}
        >
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default MobileNav;
