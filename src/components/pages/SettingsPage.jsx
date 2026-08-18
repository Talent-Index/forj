import { Button, Card } from "../ui/primitives";

function SettingsPage({
  address,
  isFuji,
  theme,
  onToggleTheme,
  reducedMotion,
  onToggleMotion,
  onReset,
  onDisconnect,
}) {
  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Settings</p>
        <h1>Preferences</h1>
      </header>

      <Card className="settings-block">
        <h2>Wallet</h2>
        <p className="meta-line">{address || "Not connected"}</p>
        <p className="meta-line">Network · {isFuji ? "Avalanche Fuji" : "Not Fuji"}</p>
        {address && (
          <Button variant="secondary" onClick={onDisconnect}>Disconnect</Button>
        )}
      </Card>

      <Card className="settings-block">
        <h2>Preferences</h2>
        <div className="settings-row">
          <span>Theme</span>
          <Button variant="secondary" onClick={onToggleTheme}>
            {theme === "dark" ? "Use light" : "Use dark"}
          </Button>
        </div>
        <div className="settings-row">
          <span>Reduced motion</span>
          <Button variant="secondary" onClick={() => onToggleMotion(!reducedMotion)}>
            {reducedMotion ? "On" : "Off"}
          </Button>
        </div>
      </Card>

      <Card className="settings-block">
        <h2>Data</h2>
        <p>Reset clears quiz scores, puzzle pieces, and local progress for this wallet in this browser.</p>
        <Button variant="danger" onClick={onReset} disabled={!address}>
          Reset local progress
        </Button>
      </Card>
    </div>
  );
}

export default SettingsPage;
