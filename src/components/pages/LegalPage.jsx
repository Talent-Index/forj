import { LEGAL_PAGES } from "../../utils/legal";
import { PRODUCT_NAME } from "../../utils/brand";

function LegalPage({ topic = "privacy" }) {
  const page = LEGAL_PAGES[topic] || LEGAL_PAGES.privacy;
  return (
    <div className="page legal-page">
      <header className="page-header">
        <p className="kicker">{PRODUCT_NAME}</p>
        <h1>{page.title}</h1>
        <p className="lede">Last updated {page.updated}. This is a simple product notice, not legal advice.</p>
      </header>
      {page.sections.map((section) => (
        <section key={section.heading} className="section-block">
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}

export default LegalPage;
