import { Button, Card } from "../ui/primitives";
import { ThemeToggle, ZoomToggle } from "../layout/Navbar";
import { shortAddress } from "../../utils/learnerStats";

function SettingsPage({
  account,
  address,
  isFuji,
  theme,
  onToggleTheme,
  zoom,
  onCycleZoom,
  reducedMotion,
  onToggleMotion,
  onReset,
  onConnectWallet,
  onDisconnectWallet,
  onSignOut,
}) {
  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Account</p>
        <h1>Profile</h1>
      </header>

      <Card className="settings-block">
        <h2>SkillForge account</h2>
        <p className="meta-line">Email · {account?.email || "—"}</p>
        <p className="meta-line">Name · {account?.name || "—"}</p>
        <p className="meta-line">Sign-in · {account?.provider === "google" ? "Google" : "Email"}</p>
        <Button variant="secondary" onClick={onSignOut}>Sign out</Button>
      </Card>

      <Card className="settings-block">
        <h2>Wallet</h2>
        <p className="meta-line">{address ? shortAddress(address) : "Not connected"}</p>
        <p className="meta-line">Network · {address ? (isFuji ? "Avalanche Fuji" : "Not Fuji") : "—"}</p>
        <p>Connect a wallet to:</p>
        <ul className="settings-list">
          <li>Save on-chain credentials</li>
          <li>Claim blockchain records</li>
          <li>Record achievements on Avalanche</li>
        </ul>
        {address ? (
          <Button variant="secondary" onClick={onDisconnectWallet}>Disconnect</Button>
        ) : (
          <Button onClick={onConnectWallet}>Connect Wallet</Button>
        )}
      </Card>

      <Card className="settings-block">
        <h2>Preferences</h2>
        <div className="settings-row">
          <span>Theme</span>
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        </div>
        <div className="settings-row">
          <span>Page zoom</span>
          <ZoomToggle zoom={zoom} onCycleZoom={onCycleZoom} />
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
        <p>Reset clears quiz scores, puzzle pieces, and local progress for this account in this browser.</p>
        <Button variant="danger" onClick={onReset} disabled={!account}>
          Reset local progress
        </Button>
      </Card>
    </div>
  );
}

export default SettingsPage;
