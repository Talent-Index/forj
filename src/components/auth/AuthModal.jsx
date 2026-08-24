import { useEffect, useState } from "react";
import { LEARNING_GOALS, MIN_PASSWORD_LENGTH } from "../../utils/auth";
import { Button, Modal } from "../ui/primitives";

const INITIAL_SIGNUP = { name: "", email: "", password: "", confirmPassword: "" };
const INITIAL_SIGNIN = { email: "", password: "" };

function Field({ id, label, type = "text", value, onChange, autoComplete, placeholder }) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
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
  verificationToken,
}) {
  const [signup, setSignup] = useState(INITIAL_SIGNUP);
  const [signin, setSignin] = useState(INITIAL_SIGNIN);
  const [googleLocal, setGoogleLocal] = useState({ email: "", name: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [reset, setReset] = useState({ password: "", confirmPassword: "" });
  const [changeEmailValue, setChangeEmailValue] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoToken, setDemoToken] = useState(verificationToken || "");

  useEffect(() => {
    if (!open) return;
    setError("");
    setInfo("");
    setDemoToken(verificationToken || "");
  }, [open, view, verificationToken]);

  async function handleGoogle() {
    setBusy(true);
    setError("");
    try {
      const result = await auth.continueWithGoogle();
      if (result.clientIdMissing || result.error === "google-fallback") {
        onChangeView("google-local");
        return;
      }
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
    const result = await auth.registerWithEmail(signup);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDemoToken(result.verificationToken || "");
    onChangeView("verify");
  }

  async function handleSignin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await auth.signInWithEmail(signin);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (!result.account?.emailVerified) {
      const resent = await auth.resendVerification(result.account.email);
      setDemoToken(resent.verificationToken || "");
      onChangeView("verify");
      return;
    }
    onClose();
  }

  async function handleGoogleLocal(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await auth.signInWithGoogle(googleLocal);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  async function handleForgot(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await auth.requestPasswordReset(forgotEmail);
    setBusy(false);
    if (result.resetToken) {
      setDemoToken(result.resetToken);
      setInfo(`Reset link created for ${result.email}.`);
      onChangeView("reset");
      return;
    }
    setInfo("If an account exists for that email, a reset link is ready.");
  }

  async function handleReset(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await auth.resetPassword({
      token: demoToken,
      password: reset.password,
      confirmPassword: reset.confirmPassword,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInfo("Password updated. Sign in with your new password.");
    onChangeView("signin");
  }

  async function handleVerify() {
    if (!demoToken) {
      setError("Open the verification link from your email to continue.");
      return;
    }
    setBusy(true);
    const result = auth.verifyEmail(demoToken);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  async function handleResend() {
    const email = auth.account?.email || pendingEmail || signup.email || signin.email;
    const result = await auth.resendVerification(email);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDemoToken(result.verificationToken || "");
    setInfo(`Verification link sent to ${email}.`);
  }

  async function handleChangeEmail(event) {
    event.preventDefault();
    const result = await auth.changeEmail(changeEmailValue);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDemoToken(result.verificationToken || "");
    setInfo(`Verification link sent to ${changeEmailValue}.`);
    setChangeEmailValue("");
  }

  const title = {
    signup: "Start your learning journey",
    signin: "Welcome back",
    forgot: "Reset your password",
    reset: "Choose a new password",
    verify: "Check your email",
    "google-local": "Continue with Google",
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
            Continue with Google
          </Button>
          <p className="auth-or">or</p>
          <Field id="signup-name" label="Name" value={signup.name} onChange={(name) => setSignup((s) => ({ ...s, name }))} autoComplete="name" placeholder="Your name" />
          <Field id="signup-email" label="Email" type="email" value={signup.email} onChange={(email) => setSignup((s) => ({ ...s, email }))} autoComplete="email" placeholder="you@example.com" />
          <Field id="signup-password" label="Password" type="password" value={signup.password} onChange={(password) => setSignup((s) => ({ ...s, password }))} autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} />
          <Field id="signup-confirm" label="Confirm password" type="password" value={signup.confirmPassword} onChange={(confirmPassword) => setSignup((s) => ({ ...s, confirmPassword }))} autoComplete="new-password" />
          <Button type="submit" className="btn-block" disabled={busy}>{busy ? "Creating…" : "Create Account"}</Button>
          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" className="text-link" onClick={() => onChangeView("signin")}>Sign in</button>
          </p>
        </form>
      )}

      {view === "signin" && (
        <form className="auth-form" onSubmit={handleSignin}>
          <Field id="signin-email" label="Email" type="email" value={signin.email} onChange={(email) => setSignin((s) => ({ ...s, email }))} autoComplete="email" placeholder="you@example.com" />
          <Field id="signin-password" label="Password" type="password" value={signin.password} onChange={(password) => setSignin((s) => ({ ...s, password }))} autoComplete="current-password" />
          <Button type="submit" className="btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign In"}</Button>
          <p className="auth-switch">
            <button type="button" className="text-link" onClick={() => onChangeView("forgot")}>Forgot password?</button>
          </p>
          <p className="auth-or">or</p>
          <Button className="btn-google btn-block" onClick={handleGoogle} disabled={busy} type="button">
            Continue with Google
          </Button>
          <p className="auth-switch">
            Don't have an account?{" "}
            <button type="button" className="text-link" onClick={() => onChangeView("signup")}>Create one</button>
          </p>
        </form>
      )}

      {view === "google-local" && (
        <form className="auth-form" onSubmit={handleGoogleLocal}>
          <p className="modal-copy">Continue with a Google email. No wallet is required.</p>
          <Field id="google-name" label="Name" value={googleLocal.name} onChange={(name) => setGoogleLocal((s) => ({ ...s, name }))} autoComplete="name" placeholder="Your name" />
          <Field id="google-email" label="Email" type="email" value={googleLocal.email} onChange={(email) => setGoogleLocal((s) => ({ ...s, email }))} autoComplete="email" placeholder="you@gmail.com" />
          <Button type="submit" className="btn-block" disabled={busy}>Continue</Button>
          <p className="auth-switch">
            <button type="button" className="text-link" onClick={() => onChangeView("signup")}>Back</button>
          </p>
        </form>
      )}

      {view === "forgot" && (
        <form className="auth-form" onSubmit={handleForgot}>
          <p className="modal-copy">Enter your email and we'll send a reset link.</p>
          <Field id="forgot-email" label="Email" type="email" value={forgotEmail} onChange={setForgotEmail} autoComplete="email" placeholder="you@example.com" />
          <Button type="submit" className="btn-block" disabled={busy}>Send Reset Link</Button>
          <p className="auth-switch">
            <button type="button" className="text-link" onClick={() => onChangeView("signin")}>← Back to sign in</button>
          </p>
        </form>
      )}

      {view === "reset" && (
        <form className="auth-form" onSubmit={handleReset}>
          <Field id="reset-password" label="New password" type="password" value={reset.password} onChange={(password) => setReset((s) => ({ ...s, password }))} autoComplete="new-password" />
          <Field id="reset-confirm" label="Confirm password" type="password" value={reset.confirmPassword} onChange={(confirmPassword) => setReset((s) => ({ ...s, confirmPassword }))} autoComplete="new-password" />
          <Button type="submit" className="btn-block" disabled={busy}>Update password</Button>
        </form>
      )}

      {view === "verify" && (
        <div className="auth-form">
          <p className="modal-copy">
            We've sent a verification link to:
            <br />
            <strong>{auth.account?.email || pendingEmail || signup.email}</strong>
          </p>
          <p className="modal-copy">Verify your email to continue.</p>
          {demoToken && (
            <Button className="btn-block" onClick={handleVerify} disabled={busy}>
              Open verification link
            </Button>
          )}
          <Button variant="secondary" className="btn-block" onClick={handleResend} disabled={busy}>
            Resend Email
          </Button>
          <form onSubmit={handleChangeEmail}>
            <Field id="change-email" label="Change email" type="email" value={changeEmailValue} onChange={setChangeEmailValue} placeholder="new@example.com" />
            <Button variant="ghost" type="submit">Update email</Button>
          </form>
        </div>
      )}
    </Modal>
  );
}

export function ProfileSetup({ account, onContinue, busy = false, error = "" }) {
  const [name, setName] = useState(account?.name || "");
  const [goal, setGoal] = useState(account?.learningGoal || "");

  return (
    <section className="onboard-screen">
      <p className="kicker">Welcome to SkillForge</p>
      <h1>What should we call you?</h1>
      <form
        className="auth-form onboard-form"
        onSubmit={(event) => {
          event.preventDefault();
          onContinue({ name, learningGoal: goal });
        }}
      >
        {error && <p className="auth-error" role="alert">{error}</p>}
        <Field id="profile-name" label="Your name" value={name} onChange={setName} autoComplete="name" placeholder="Your name" />
        <fieldset className="auth-goals">
          <legend>Choose your learning goal</legend>
          <p className="note">Optional. This does not change the quizzes.</p>
          {LEARNING_GOALS.map((item) => (
            <label key={item.id} className="auth-goal">
              <input
                type="radio"
                name="learning-goal"
                value={item.id}
                checked={goal === item.id}
                onChange={() => setGoal(item.id)}
              />
              {item.label}
            </label>
          ))}
        </fieldset>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
      </form>
    </section>
  );
}

export function WalletOptional({ onConnect, onSkip }) {
  return (
    <section className="onboard-screen">
      <p className="kicker">Your account is ready</p>
      <h1>You can start learning immediately.</h1>
      <p className="lede">
        Connect a wallet when you're ready to interact with Avalanche.
        Quizzes, points, and the puzzle do not require a wallet.
      </p>
      <div className="hero-actions">
        <Button onClick={onConnect}>Connect Wallet</Button>
        <Button variant="secondary" onClick={onSkip}>Continue Without Wallet</Button>
      </div>
    </section>
  );
}

export default AuthModal;
export { LEARNING_GOALS };
