import { BrandMark } from "../brand/ForjoraMark";
import { PRODUCT_DESCRIPTION } from "../../utils/brand";

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <BrandMark />
      <nav className="footer-links" aria-label="Footer">
        <button type="button" onClick={() => onNavigate("learn")}>Learn</button>
        <button type="button" onClick={() => onNavigate("credentials")}>Credentials</button>
        <button type="button" onClick={() => onNavigate("lookup")}>Lookup</button>
        <button type="button" onClick={() => onNavigate("about")}>About</button>
        <button type="button" onClick={() => onNavigate("privacy")}>Privacy</button>
        <button type="button" onClick={() => onNavigate("terms")}>Terms</button>
      </nav>
      <p className="footer-note">{PRODUCT_DESCRIPTION}</p>
    </footer>
  );
}

export default Footer;
