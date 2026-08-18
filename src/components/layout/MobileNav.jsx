import { NAV_ITEMS } from "./Navbar";

function MobileNav({ page, onNavigate, isConnected }) {
  if (!isConnected) return null;
  const items = [
    ...NAV_ITEMS.slice(0, 3),
    { id: "settings", label: "More" },
  ];
  return (
    <nav className="mobile-nav" aria-label="Mobile">
      {items.map((item) => (
        <button
          key={item.id}
          className={`mobile-nav-item ${page === item.id ? "active" : ""}`}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export default MobileNav;
