import { BrandMark } from "./Navbar";

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <BrandMark />
        <p>Learn Avalanche. Forge your skills.</p>
      </div>
      <nav className="footer-links" aria-label="Footer">
        <button type="button" onClick={() => onNavigate("learn")}>Learn</button>
        <button type="button" onClick={() => onNavigate("credentials")}>Credentials</button>
        <button type="button" onClick={() => onNavigate("about")}>About</button>
        <button type="button" onClick={() => onNavigate("lookup")}>Lookup</button>
        <a href="https://github.com/Talent-Index/SkillForge" target="_blank" rel="noreferrer">GitHub</a>
        <button type="button" onClick={() => onNavigate("about")}>Documentation</button>
      </nav>
      <p className="footer-note">Built on Avalanche · claimed scores are not proctored exams</p>
    </footer>
  );
}

export default Footer;
