import { BrandMark } from "./Navbar";

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <BrandMark />
        <p>Learn Avalanche. Forge. Prove.</p>
      </div>
      <nav className="footer-links" aria-label="Footer">
        <button type="button" onClick={() => onNavigate("learn")}>Learn</button>
        <button type="button" onClick={() => onNavigate("credentials")}>Credentials</button>
        <button type="button" onClick={() => onNavigate("about")}>About</button>
        <button type="button" onClick={() => onNavigate("lookup")}>Lookup</button>
        <button type="button" onClick={() => onNavigate("privacy")}>Privacy</button>
        <button type="button" onClick={() => onNavigate("terms")}>Terms</button>
      </nav>
      <p className="footer-note">Built on Avalanche · claimed scores are not proctored exams</p>
    </footer>
  );
}

export default Footer;
