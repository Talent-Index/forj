import { Button } from "../ui/primitives";
import { AnimatedDoodle, Doodle, DoodleText } from "../doodles";

function NotFoundPage({ path = "", onHome, onLookup, onAbout }) {
  const shownPath = path && path !== "/" ? path : "/…";

  return (
    <div className="page not-found-page">
      <header className="page-header not-found-hero">
        <p className="kicker">404</p>
        <div className="not-found-mark" aria-hidden="true">
          <AnimatedDoodle
            type="question"
            animation="draw"
            trigger="immediate"
            size={56}
            variant="accent"
          />
        </div>
        <h1>
          <DoodleText trigger="immediate" mark="underline">
            Path not forged
          </DoodleText>
        </h1>
        <p className="lede">
          This page is not part of Forjora. The path may be mistyped, moved, or never existed.
        </p>
        <p className="meta-line not-found-path">
          Requested: <span className="credential-mono">{shownPath}</span>
        </p>
      </header>

      <section className="section-block not-found-actions" aria-label="Continue">
        <div className="certificate-actions">
          <Button onClick={onHome}>
            <Doodle type="door" size={14} variant="ink" /> Back home
          </Button>
          {onLookup ? (
            <Button variant="secondary" onClick={onLookup}>
              <Doodle type="certificate" size={14} variant="ink" /> Look up a credential
            </Button>
          ) : null}
          {onAbout ? (
            <Button variant="ghost" onClick={onAbout}>
              About Forjora
            </Button>
          ) : null}
        </div>
        <p className="note">
          Looking for a Fuji credential? Use Lookup with a token ID or share URL.
        </p>
      </section>
    </div>
  );
}

export default NotFoundPage;
