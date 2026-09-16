const MESSAGES = {
  "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Use at least 8 characters for your password.",
  "auth/user-not-found": "Email or password is incorrect. If you are new here, create an account first.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/invalid-credential": "Email or password is incorrect. If you are new here, create an account first.",
  "auth/invalid-login-credentials": "Email or password is incorrect. If you are new here, create an account first.",
  "auth/missing-password": "Enter your password.",
  "auth/missing-email": "Enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
  "auth/popup-blocked": "The browser blocked the Google sign-in popup.",
  "auth/cancelled-popup-request": "Google sign-in was cancelled.",
  "auth/account-exists-with-different-credential": "This email is already used with Google. Continue with Google, or add a password from your profile after signing in.",
  "auth/requires-recent-login": "Sign in again to finish this account change.",
  "auth/expired-action-code": "This link has expired. Request a new one.",
  "auth/invalid-action-code": "This link is invalid or has already been used.",
  "auth/user-disabled": "This account is disabled.",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled for this Firebase project yet.",
};

function looksLikeBadCredentials(message = "") {
  return /INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_EMAIL|MISSING_PASSWORD/i.test(
    message
  );
}

export function mapAuthError(error) {
  const code = error?.code || "";
  if (MESSAGES[code]) return MESSAGES[code];
  const message = String(error?.message || "");
  if (looksLikeBadCredentials(message)) {
    return "Email or password is incorrect. If you are new here, create an account first.";
  }
  if (/OPERATION_NOT_ALLOWED/i.test(message)) {
    return MESSAGES["auth/operation-not-allowed"];
  }
  return message || "Something went wrong. Try again.";
}

export function isCredentialAuthError(error) {
  const code = error?.code || "";
  return (
    code === "auth/invalid-credential"
    || code === "auth/invalid-login-credentials"
    || code === "auth/user-not-found"
    || code === "auth/wrong-password"
    || looksLikeBadCredentials(error?.message || "")
  );
}
