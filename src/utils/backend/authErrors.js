export function mapAuthError(error) {
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Use at least 8 characters for your password.",
    "auth/user-not-found": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/popup-blocked": "The browser blocked the Google sign-in popup.",
    "auth/cancelled-popup-request": "Google sign-in was cancelled.",
    "auth/account-exists-with-different-credential": "This email is already used with a different sign-in method.",
    "auth/requires-recent-login": "Sign in again to finish this account change.",
    "auth/expired-action-code": "This link has expired. Request a new one.",
    "auth/invalid-action-code": "This link is invalid or has already been used.",
    "auth/user-disabled": "This account is disabled.",
    "auth/operation-not-allowed": "This sign-in method is not available yet.",
  };
  return messages[code] || error?.message || "Something went wrong. Try again.";
}
