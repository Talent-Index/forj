function MobileNav({ page, onNavigate, isAuthenticated, loggedInLinks, loggedOutLinks }) {
  const items = isAuthenticated
    ? [...loggedInLinks, { id: "settings", label: "More" }]
    : [...loggedOutLinks.filter((item) => item.id !== "learn"), { id: "landing", label: "Home" }, { id: "about", label: "About" }]
        .filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index)
        .slice(0, 4);

  return (
    <nav className="mobile-nav" aria-label="Mobile">
      {items.map((item) => (
        <button
          key={item.id}
          className={`mobile-nav-item ${page === item.id ? "is-active" : ""}`}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export default MobileNav;
