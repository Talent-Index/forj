import { BrandMark } from "../brand/ForjoraMark";

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <BrandMark />
      <nav className="footer-links" aria-label="Footer">
        <button type="button" onClick={() => onNavigate("learn")}>Learn</button>
        <button type="button" onClick={() => onNavigate("credentials")}>Credentials</button>
        <button type="button" onClick={() => onNavigate("about")}>About</button>
        <button type="button" onClick={() => onNavigate("privacy")}>Privacy</button>
        <button type="button" onClick={() => onNavigate("terms")}>Terms</button>
      </nav>
      <p className="footer-note">Claimed scores are not exams</p>
    </footer>
  );
}

export default Footer;
