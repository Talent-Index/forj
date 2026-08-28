import { createMemoryStorage, normalizeAddress, progressOwnerId } from "./progress.js";
import { applyProfileCompletion } from "./profileOnboarding.js";
import { validateRecipientName } from "./recipient.js";
import { safeAvatarSrc } from "./frontendSecurity.js";

export const AUTH_STORAGE_VERSION = 1;
export const AUTH_ACCOUNTS_KEY = `skillforge.auth.v${AUTH_STORAGE_VERSION}.accounts`;
export const AUTH_SESSION_KEY = `skillforge.auth.v${AUTH_STORAGE_VERSION}.session`;
export const AUTH_TOKENS_KEY = `skillforge.auth.v${AUTH_STORAGE_VERSION}.tokens`;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_AVATAR_BYTES = 350_000;

export const AUTH_PROVIDERS = {
  email: "email",
  google: "google",
};

export const LEARNING_GOALS = [
  { id: "avalanche", label: "Learn Avalanche" },
  { id: "web3", label: "Improve Web3 knowledge" },
  { id: "credentials", label: "Earn credentials" },
  { id: "development", label: "Explore Avalanche development" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

function defaultStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // Private mode or blocked storage.
  }
  return createMemoryStorage();
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(size = 16) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export function createAccountId() {
  return `acc_${randomHex(12)}`;
}

export function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_RE.test(normalizeEmail(email));
}

export function passwordIssue(password, confirmPassword) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  if (confirmPassword != null && password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return "";
}

/** Client-side checks for email/password forms before calling Firebase. */
export function emailPasswordFormIssue({
  email,
  password,
  confirmPassword,
  name,
  mode = "signin",
} = {}) {
  if (mode === "signup") {
    const recipient = typeof name === "string" ? name.trim() : "";
    if (!recipient) return "Enter your name.";
  }
  if (!isValidEmail(email)) return "Enter a valid email address.";
  if (mode === "signin") {
    if (typeof password !== "string" || !password) return "Enter your password.";
    return "";
  }
  if (mode === "forgot") return "";
  return passwordIssue(password, confirmPassword);
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

export async function hashPassword(password, salt) {
  return sha256Hex(`${salt}:${password}`);
}

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

function publicAccount(account) {
  if (!account) return null;
  const safe = Object.fromEntries(
    Object.entries(account).filter(([key]) => key !== "passwordHash" && key !== "passwordSalt")
  );
  return {
    ...safe,
    hasPassword: Boolean(account.passwordHash),
    avatarUrl: account.avatarUrl || "",
  };
}

function findAccount(accounts, email) {
  const normalized = normalizeEmail(email);
  return accounts.find((item) => item.email === normalized) || null;
}

function now() {
  return Date.now();
}

function makeToken(type, accountId, email) {
  return {
    token: randomHex(24),
    type,
    accountId,
    email: normalizeEmail(email),
    expiresAt: now() + TOKEN_TTL_MS,
  };
}

export function onboardingStage(account) {
  if (!account) return "anonymous";
  if (!account.emailVerified) return "verify-email";
  if (!account.profileComplete) return "profile";
  return "ready";
}

export function authOwnerId(account) {
  return progressOwnerId(account?.id);
}

export function createAuthStore(storage = defaultStorage()) {
  function loadAccounts() {
    const rows = readJson(storage, AUTH_ACCOUNTS_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function saveAccounts(accounts) {
    writeJson(storage, AUTH_ACCOUNTS_KEY, accounts);
  }

  function loadTokens() {
    const rows = readJson(storage, AUTH_TOKENS_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function saveTokens(tokens) {
    writeJson(storage, AUTH_TOKENS_KEY, tokens);
  }

  function getAccountById(accountId) {
    return loadAccounts().find((item) => item.id === accountId) || null;
  }

  function setSession(accountId) {
    if (!accountId) {
      storage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    const session = { accountId, createdAt: now() };
    writeJson(storage, AUTH_SESSION_KEY, session);
    return session;
  }

  function replaceAccount(next) {
    saveAccounts(loadAccounts().map((item) => (item.id === next.id ? next : item)));
    return next;
  }

  function consumeToken(token, type) {
    const tokens = loadTokens();
    const match = tokens.find((item) => item.token === token && item.type === type);
    if (!match || match.expiresAt < now()) return null;
    saveTokens(tokens.filter((item) => item.token !== token));
    return match;
  }

  function persistVerifyToken(account) {
    const verify = makeToken("verify", account.id, account.email);
    saveTokens([
      ...loadTokens().filter((item) => !(item.accountId === account.id && item.type === "verify")),
      verify,
    ]);
    return verify.token;
  }

  async function writePassword(account, password, confirmPassword) {
    const issue = passwordIssue(password, confirmPassword);
    if (issue) return { ok: false, error: issue };
    const passwordSalt = randomHex(16);
    return {
      ok: true,
      account: replaceAccount({
        ...account,
        passwordSalt,
        passwordHash: await hashPassword(password, passwordSalt),
      }),
    };
  }

  const store = {
    currentAccount() {
      const session = readJson(storage, AUTH_SESSION_KEY, null);
      if (!session?.accountId) return null;
      return publicAccount(getAccountById(session.accountId));
    },

    async registerWithEmail({ name, email, password, confirmPassword }) {
      const recipient = validateRecipientName(name);
      if (!recipient.ok) return { ok: false, error: recipient.error };
      const normalized = normalizeEmail(email);
      if (!isValidEmail(normalized)) return { ok: false, error: "Enter a valid email address." };
      const issue = passwordIssue(password, confirmPassword);
      if (issue) return { ok: false, error: issue };

      const accounts = loadAccounts();
      if (findAccount(accounts, normalized)) {
        return { ok: false, error: "An account with this email already exists. Sign in instead." };
      }

      const passwordSalt = randomHex(16);
      const account = {
        id: createAccountId(),
        email: normalized,
        name: recipient.name,
        provider: AUTH_PROVIDERS.email,
        emailVerified: false,
        googleId: "",
        learningGoal: "",
        profileComplete: true,
        walletPromptSeen: true,
        walletAddress: null,
        avatarUrl: "",
        passwordSalt,
        passwordHash: await hashPassword(password, passwordSalt),
        createdAt: now(),
      };
      saveAccounts([...accounts, account]);
      const verificationToken = persistVerifyToken(account);
      setSession(account.id);
      return { ok: true, account: publicAccount(account), verificationToken };
    },

    async signInWithEmail({ email, password }) {
      const account = findAccount(loadAccounts(), email);
      if (!account?.passwordHash) {
        if (account?.provider === AUTH_PROVIDERS.google) {
          return { ok: false, error: "This account uses Google. Continue with Google, or create a password from your profile." };
        }
        return { ok: false, error: "Email or password is incorrect." };
      }
      const hash = await hashPassword(password, account.passwordSalt);
      if (hash !== account.passwordHash) {
        return { ok: false, error: "Email or password is incorrect." };
      }
      setSession(account.id);
      return { ok: true, account: publicAccount(account) };
    },

    signInWithGoogle({ email, name, googleId, avatarUrl = "" }) {
      const normalized = normalizeEmail(email);
      if (!isValidEmail(normalized)) return { ok: false, error: "Google did not return a valid email." };
      const accounts = loadAccounts();
      let account = findAccount(accounts, normalized);
      if (account) {
        const recipient = validateRecipientName(name);
        account = replaceAccount({
          ...account,
          googleId: googleId || account.googleId,
          emailVerified: true,
          name: account.name || (recipient.ok ? recipient.name : account.name),
          avatarUrl: account.avatarUrl || avatarUrl || "",
          profileComplete: account.profileComplete || recipient.ok,
          walletPromptSeen: account.walletPromptSeen || recipient.ok,
        });
      } else {
        const recipient = validateRecipientName(name);
        account = {
          id: createAccountId(),
          email: normalized,
          name: recipient.ok ? recipient.name : "",
          provider: AUTH_PROVIDERS.google,
          emailVerified: true,
          googleId: googleId || "",
          learningGoal: "",
          profileComplete: recipient.ok,
          walletPromptSeen: recipient.ok,
          walletAddress: null,
          avatarUrl: avatarUrl || "",
          passwordSalt: "",
          passwordHash: "",
          createdAt: now(),
        };
        saveAccounts([...accounts, account]);
      }
      setSession(account.id);
      return { ok: true, account: publicAccount(account) };
    },

    verifyEmail(token) {
      const match = consumeToken(token, "verify");
      if (!match) return { ok: false, error: "This verification link is invalid or has expired." };
      const account = getAccountById(match.accountId);
      if (!account) return { ok: false, error: "Account not found." };
      const next = replaceAccount({ ...account, emailVerified: true });
      setSession(next.id);
      return { ok: true, account: publicAccount(next) };
    },

    resendVerification(email) {
      const account = findAccount(loadAccounts(), email);
      if (!account) return { ok: false, error: "No account found for that email." };
      if (account.emailVerified) return { ok: false, error: "This email is already verified." };
      const verificationToken = persistVerifyToken(account);
      setSession(account.id);
      return { ok: true, account: publicAccount(account), verificationToken };
    },

    requestPasswordReset(email) {
      const account = findAccount(loadAccounts(), email);
      if (!account?.passwordHash && account?.provider !== AUTH_PROVIDERS.email) {
        return { ok: true };
      }
      if (!account) return { ok: true };
      const reset = makeToken("reset", account.id, account.email);
      saveTokens([
        ...loadTokens().filter((item) => !(item.accountId === account.id && item.type === "reset")),
        reset,
      ]);
      return { ok: true, resetToken: reset.token, email: account.email };
    },

    async resetPassword({ token, password, confirmPassword }) {
      const issue = passwordIssue(password, confirmPassword);
      if (issue) return { ok: false, error: issue };
      const match = consumeToken(token, "reset");
      if (!match) return { ok: false, error: "This reset link is invalid or has expired." };
      const account = getAccountById(match.accountId);
      if (!account) return { ok: false, error: "Account not found." };
      const written = await writePassword(account, password, confirmPassword);
      if (!written.ok) return written;
      replaceAccount({ ...written.account, emailVerified: true });
      return { ok: true };
    },

    async changePassword(accountId, { currentPassword, password, confirmPassword }) {
      const account = getAccountById(accountId);
      if (!account) return { ok: false, error: "Sign in to continue." };
      if (!account.passwordHash) {
        return { ok: false, error: "This account does not have a password yet. Create one first." };
      }
      const currentHash = await hashPassword(currentPassword, account.passwordSalt);
      if (currentHash !== account.passwordHash) {
        return { ok: false, error: "Current password is incorrect." };
      }
      const written = await writePassword(account, password, confirmPassword);
      if (!written.ok) return written;
      return { ok: true, account: publicAccount(written.account) };
    },

    async setPassword(accountId, { password, confirmPassword }) {
      const account = getAccountById(accountId);
      if (!account) return { ok: false, error: "Sign in to continue." };
      if (account.passwordHash) {
        return { ok: false, error: "This account already has a password. Use change password instead." };
      }
      const written = await writePassword(account, password, confirmPassword);
      if (!written.ok) return written;
      return { ok: true, account: publicAccount(written.account) };
    },

    completeProfile(accountId, { name, learningGoal = "", avatarUrl } = {}) {
      const account = getAccountById(accountId);
      const next = applyProfileCompletion(account, { name, learningGoal, avatarUrl });
      if (!next.ok) return next;
      return { ok: true, account: publicAccount(replaceAccount(next.account)) };
    },

    updateProfile(accountId, { name, learningGoal, avatarUrl } = {}) {
      const account = getAccountById(accountId);
      if (!account) return { ok: false, error: "Sign in to continue." };
      const recipient = name == null ? { ok: true, name: account.name } : validateRecipientName(name);
      if (!recipient.ok) return { ok: false, error: recipient.error };
      const goal = learningGoal == null
        ? account.learningGoal
        : LEARNING_GOALS.some((item) => item.id === learningGoal)
          ? learningGoal
          : "";
      const next = replaceAccount({
        ...account,
        name: recipient.name,
        learningGoal: goal,
        avatarUrl: avatarUrl == null ? account.avatarUrl || "" : avatarUrl,
      });
      return { ok: true, account: publicAccount(next) };
    },

    updateAvatar(accountId, avatarUrl) {
      const account = getAccountById(accountId);
      if (!account) return { ok: false, error: "Sign in to continue." };
      if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.length > MAX_AVATAR_BYTES) {
        return { ok: false, error: "That image is too large. Try a smaller photo." };
      }
      const safe = avatarUrl ? safeAvatarSrc(avatarUrl) : "";
      if (avatarUrl && !safe) {
        return { ok: false, error: "Use a JPEG, PNG, or WebP photo." };
      }
      const next = replaceAccount({
        ...account,
        avatarUrl: safe,
      });
      return { ok: true, account: publicAccount(next) };
    },

    linkWallet(accountId, address) {
      const account = getAccountById(accountId);
      const normalized = normalizeAddress(address);
      if (!account) return { ok: false, error: "Sign in to continue." };
      if (!normalized) return { ok: false, error: "Connect a valid wallet address." };
      return {
        ok: true,
        account: publicAccount(replaceAccount({
          ...account,
          walletAddress: normalized,
          walletPromptSeen: true,
        })),
      };
    },

    unlinkWallet(accountId) {
      const account = getAccountById(accountId);
      if (!account) return { ok: false, error: "Sign in to continue." };
      return { ok: true, account: publicAccount(replaceAccount({ ...account, walletAddress: null })) };
    },

    changeEmail(accountId, email) {
      const account = getAccountById(accountId);
      if (!account) return { ok: false, error: "Sign in to continue." };
      const normalized = normalizeEmail(email);
      if (!isValidEmail(normalized)) return { ok: false, error: "Enter a valid email address." };
      if (findAccount(loadAccounts(), normalized) && account.email !== normalized) {
        return { ok: false, error: "That email is already in use." };
      }
      const next = replaceAccount({
        ...account,
        email: normalized,
        emailVerified: false,
      });
      const verificationToken = persistVerifyToken(next);
      return { ok: true, account: publicAccount(next), verificationToken };
    },

    signOut() {
      setSession(null);
      return { ok: true, account: null };
    },
  };

  return store;
}
