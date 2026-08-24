import { useEffect, useState } from "react";
import { MIN_PASSWORD_LENGTH } from "../../utils/auth";
import { validateRecipientName } from "../../utils/recipient";
import { Button, Modal } from "../ui/primitives";

const EMPTY_SIGNUP = { name: "", email: "", password: "", confirmPassword: "" };
const EMPTY_SIGNIN = { email: "", password: "" };

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="#34A853" d="M6.6 14.3 5.5 15.1 3.7 16.5C5.2 19.5 8.3 21.5 12 21.5c2.4 0 4.4-.8 5.9-2.1l-3-2.3c-.8.6-1.9.9-2.9.9-2.2 0-4.1-1.5-4.8-3.5z" />
      <path fill="#FBBC05" d="M3.7 7.5C3 8.8 2.6 10.3 2.6 12s.4 3.2 1.1 4.5l2.9-2.2C6.3 13.3 6.2 12.7 6.2 12s.1-1.3.4-1.8z" />
      <path fill="#4285F4" d="M12 5.9c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.4 3.2 14.4 2.5 12 2.5 8.3 2.5 5.2 4.5 3.7 7.5l2.9 2.2C7.9 7.4 9.8 5.9 12 5.9z" />
    </svg>
  );
}

function Field({ id, label, type = "text", value, onChange, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <span className={isPassword ? "auth-password-wrap" : undefined}>
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        {isPassword ? (
          <button type="button" className="auth-password-toggle" onClick={() => setVisible((current) => !current)}>
            {visible ? "Hide" : "Show"}
          </button>
        ) : null}
      </span>
    </label>
  );
}

function AuthModal({
  open,
  view,
  onChangeView,
  onClose,
  auth,
  pendingEmail,
  oobCode = "",
  onOpenLegal,
}) {
  const [signup, setSignup] = useState(EMPTY_SIGNUP);
  const [signin, setSignin] = useState(EMPTY_SIGNIN);
  const [forgotEmail, setForgotEmail] = useState("");
  const [reset, setReset] = useState({ password: "", confirmPassword: "" });
  const [changeEmailValue, setChangeEmailValue] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setInfo("");
  }, [open, view]);

  async function handleGoogle() {
    setBusy(true);
    setError("");
    try {
      const result = await auth.continueWithGoogle();
      if (!result.ok) {
        setError(result.error || "Google sign-in failed.");
        return;
      }
      onClose();
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await auth.registerWithEmail(signup);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChangeView("verify");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await auth.signInWithEmail(signin);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!result.account?.emailVerified) {
        await auth.resendVerification();
        onChangeView("verify");
        return;
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await auth.requestPasswordReset(forgotEmail);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo("If an account exists for that email, a reset link is on its way.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await auth.resetPassword({
        oobCode,
        password: reset.password,
        confirmPassword: reset.confirmPassword,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo("Password updated. Sign in with your new password.");
      onChangeView("signin");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setBusy(true);
    setError("");
    try {
      const result = await auth.verifyEmail(oobCode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.account?.emailVerified) onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setBusy(true);
    setError("");
    try {
      const result = await auth.resendVerification();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo(`Verification email sent to ${auth.account?.email || pendingEmail || signup.email}.`);
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeEmail(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await auth.changeEmail(changeEmailValue);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo(`Verification email sent to ${changeEmailValue}.`);
      setChangeEmailValue("");
    } finally {
      setBusy(false);
    }
  }

  const title = {
    signup: "Create your account",
    signin: "Welcome back",
    forgot: "Reset your password",
    reset: "Choose a new password",
    verify: "Check your email",
  }[view] || "SkillForge";

  return (
    <Modal open={open} title="SkillForge" onClose={onClose} className="auth-modal">
      <p className="auth-kicker">SkillForge</p>
      <h3 className="auth-title">{title}</h3>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {info && <p className="auth-info" role="status">{info}</p>}

      {view === "signup" && (
        <form className="auth-form" onSubmit={handleSignup}>
          <Button className="btn-google btn-block" onClick={handleGoogle} disabled={busy} type="button">
            <GoogleMark /> Continue with Google
          </Button>
          <p className="auth-or">or</p>
          <Field id="signup-name" label="Name" value={signup.name} onChange={(name) => setSignup((current) => ({ ...current, name }))} autoComplete="name" placeholder="Your name" />
          <Field id="signup-email" label="Email" type="email" value={signup.email} onChange={(email) => setSignup((current) => ({ ...current, email }))} autoComplete="email" placeholder="you@example.com" />
          <Field id="signup-password" label="Password" type="password" value={signup.password} onChange={(password) => setSignup((current) => ({ ...current, password }))} autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} />
          <Field id="signup-confirm" label="Confirm password" type="password" value={signup.confirmPassword} onChange={(confirmPassword) => setSignup((current) => ({ ...current, confirmPassword }))} autoComplete="new-password" />
          <Button type="submit" className="btn-block" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
          <p className="auth-legal">
            By creating an account you agree to the{" "}
            <button type="button" className="text-link" onClick={() => onOpenLegal?.("terms")}>Terms of Service</button>
            {" "}and{" "}
            <button type="button" className="text-link" onClick={() => onOpenLegal?.("privacy")}>Privacy Policy</button>.
          </p>
          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" className="text-link" onClick={() => onChangeView("signin")}>Sign in</button>
          </p>
        </form>
      )}

      {view === "signin" && (
        <form className="auth-form" onSubmit={handleSignin}>
          <Button className="btn-google btn-block" onClick={handleGoogle} disabled={busy} type="button">
            <GoogleMark /> Continue with Google
          </Button>
          <p className="auth-or">or</p>
          <Field id="signin-email" label="Email" type="email" value={signin.email} onChange={(email) => setSignin((current) => ({ ...current, email }))} autoComplete="email" placeholder="you@example.com" />
          <Field id="signin-password" label="Password" type="password" value={signin.password} onChange={(password) => setSignin((current) => ({ ...current, password }))} autoComplete="current-password" />
          <Button type="submit" className="btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          <p className="auth-switch">
            <button type="button" className="text-link" onClick={() => onChangeView("forgot")}>Forgot password?</button>
          </p>
          <p className="auth-switch">
            Don't have an account?{" "}
            <button type="button" className="text-link" onClick={() => onChangeView("signup")}>Create one</button>
          </p>
        </form>
      )}

      {view === "forgot" && (
        <form className="auth-form" onSubmit={handleForgot}>
          <p className="modal-copy">Enter your email and we will send a reset link if an account exists.</p>
          <Field id="forgot-email" label="Email" type="email" value={forgotEmail} onChange={setForgotEmail} autoComplete="email" placeholder="you@example.com" />
          <Button type="submit" className="btn-block" disabled={busy}>Send reset link</Button>
          <p className="auth-switch">
            <button type="button" className="text-link" onClick={() => onChangeView("signin")}>Back to sign in</button>
          </p>
        </form>
      )}

      {view === "reset" && (
        <form className="auth-form" onSubmit={handleReset}>
          <Field id="reset-password" label="New password" type="password" value={reset.password} onChange={(password) => setReset((current) => ({ ...current, password }))} autoComplete="new-password" />
          <Field id="reset-confirm" label="Confirm password" type="password" value={reset.confirmPassword} onChange={(confirmPassword) => setReset((current) => ({ ...current, confirmPassword }))} autoComplete="new-password" />
          <Button type="submit" className="btn-block" disabled={busy}>Update password</Button>
        </form>
      )}

      {view === "verify" && (
        <div className="auth-form">
          <p className="modal-copy">
            We sent a verification link to:
            <br />
            <strong>{auth.account?.email || pendingEmail || signup.email}</strong>
          </p>
          <Button className="btn-block" onClick={handleVerify} disabled={busy}>
            I have verified my email
          </Button>
          <Button variant="secondary" className="btn-block" onClick={handleResend} disabled={busy}>
            Resend email
          </Button>
          <form onSubmit={handleChangeEmail}>
            <Field id="change-email" label="Change email" type="email" value={changeEmailValue} onChange={setChangeEmailValue} placeholder="new@example.com" />
            <Button variant="ghost" type="submit" disabled={busy}>Update email</Button>
          </form>
        </div>
      )}
    </Modal>
  );
}

export function ProfileSetup({ account, onContinue, busy = false, error = "" }) {
  const [name, setName] = useState(account?.name || "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (account?.name) setName((current) => current || account.name);
  }, [account?.name]);

  function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const recipient = validateRecipientName(name);
    if (!recipient.ok) {
      setLocalError(recipient.error);
      return;
    }
    setLocalError("");
    onContinue({ name: recipient.name });
  }

  const shownError = localError || error;

  return (
    <section className="onboard-screen">
      <p className="kicker">Welcome to SkillForge</p>
      <h1>What should we call you?</h1>
      <form className="auth-form onboard-form" onSubmit={handleSubmit}>
        {shownError && <p className="auth-error" role="alert">{shownError}</p>}
        <Field id="profile-name" label="Your name" value={name} onChange={(value) => { setLocalError(""); setName(value); }} autoComplete="name" placeholder="Your name" />
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
      </form>
    </section>
  );
}

export default AuthModal;
