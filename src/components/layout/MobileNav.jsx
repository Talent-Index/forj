import { NAV_ITEMS } from "./Navbar";

function MobileNav({ page, onNavigate, isConnected }) {
  const items = isConnected
    ? [...NAV_ITEMS.slice(0, 3), { id: "lookup", label: "Lookup" }, { id: "settings", label: "More" }]
    : [
        { id: "landing", label: "Home" },
        { id: "lookup", label: "Lookup" },
        { id: "about", label: "About" },
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
