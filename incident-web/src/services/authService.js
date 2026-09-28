// Cognito Authorization Code + PKCE for a PUBLIC browser client.
// No client secret exists or is used anywhere in this module.
// Tokens live in sessionStorage (cleared when the tab closes) and are never logged.
import { cognitoConfig, cognitoEndpoints } from "../config/cognito.js";
import { createPkcePair, randomUrlSafeString } from "../utils/pkce.js";
import { decodeJwtPayload, isJwtExpired } from "../utils/jwt.js";
import { resolveRole } from "../utils/roles.js";

const SESSION_KEY = "incidentai.auth.session";
const PKCE_KEY = "incidentai.auth.pkce";
const CALLBACK_KEY = "incidentai.auth.callback";

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

// In-memory lock so React StrictMode (mount → cleanup → remount) cannot
// start a second token exchange for the same authorization code.
let inflightExchange = null;

// ---------- storage ----------

function readJson(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function readSession() {
  return readJson(SESSION_KEY);
}

function writeSession(session) {
  writeJson(SESSION_KEY, session);
}

function clearPkce() {
  sessionStorage.removeItem(PKCE_KEY);
}

function clearCallback() {
  sessionStorage.removeItem(CALLBACK_KEY);
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  clearPkce();
  clearCallback();
}

// ---------- login ----------

export async function startLogin() {
  clearCallback();

  const { codeVerifier, codeChallenge } = await createPkcePair();
  const state = randomUrlSafeString(16);
  const pkce = { codeVerifier, state };

  writeJson(PKCE_KEY, pkce);

  // Confirm the verifier actually landed before leaving the page.
  const stored = readJson(PKCE_KEY);
  if (!stored?.codeVerifier || stored.state !== state) {
    throw new AuthError(
      "STORAGE",
      "Could not persist the sign-in challenge. Please try again.",
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: cognitoConfig.clientId,
    redirect_uri: cognitoConfig.redirectUri,
    scope: cognitoConfig.scopes.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.assign(`${cognitoEndpoints.authorize}?${params.toString()}`);
}

// ---------- redirect callback ----------

function hasUrlCallbackParams() {
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("error");
}

export function hasAuthCallbackParams() {
  return hasUrlCallbackParams() || readJson(CALLBACK_KEY) != null;
}

function stripAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  ["code", "state", "error", "error_description"].forEach((k) =>
    url.searchParams.delete(k),
  );
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, next);
}

/**
 * Snapshot ?code / ?error into sessionStorage BEFORE stripping the URL.
 * StrictMode remounts (and later getValidSession bootstraps) can recover
 * the callback even after replaceState.
 */
function captureCallbackFromUrl() {
  if (!hasUrlCallbackParams()) return readJson(CALLBACK_KEY);

  const params = new URLSearchParams(window.location.search);
  const snapshot = {
    code: params.get("code"),
    state: params.get("state"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
  };

  const existing = readJson(CALLBACK_KEY);
  if (!existing || existing.code !== snapshot.code || existing.error !== snapshot.error) {
    writeJson(CALLBACK_KEY, snapshot);
  }

  stripAuthParamsFromUrl();
  return readJson(CALLBACK_KEY);
}

async function requestTokens(body) {
  let response;
  try {
    response = await fetch(cognitoEndpoints.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    });
  } catch {
    throw new AuthError(
      "NETWORK",
      "Could not reach the identity provider. Check your connection and try again.",
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || !payload.access_token) {
    const reason = payload?.error || `HTTP ${response.status}`;
    throw new AuthError(
      "TOKEN_EXCHANGE",
      `Sign-in could not be completed (${reason}). Please try again.`,
    );
  }
  return payload;
}

function toSession(tokens, previous = null) {
  const expiresIn = Number(tokens.expires_in) || 3600;
  return {
    accessToken: tokens.access_token,
    idToken: tokens.id_token || previous?.idToken || null,
    refreshToken: tokens.refresh_token || previous?.refreshToken || null,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

function discardCallbackArtifacts() {
  clearPkce();
  clearCallback();
}

async function exchangeAuthorizationCode(callback, pkce) {
  const tokens = await requestTokens({
    grant_type: "authorization_code",
    client_id: cognitoConfig.clientId,
    code: callback.code,
    redirect_uri: cognitoConfig.redirectUri,
    code_verifier: pkce.codeVerifier,
  });

  const session = toSession(tokens);
  writeSession(session);
  discardCallbackArtifacts();
  return session;
}

/**
 * Completes the PKCE flow after Cognito redirects back with ?code=...
 * Safe to call twice: the same in-flight promise is reused, and PKCE is
 * only cleared after success or a confirmed unrecoverable error.
 */
export async function completeLoginFromRedirect() {
  const callback = captureCallbackFromUrl();

  if (callback?.error) {
    const description = callback.errorDescription || callback.error;
    discardCallbackArtifacts();
    throw new AuthError("PROVIDER", `Sign-in was not completed: ${description}`);
  }

  if (!callback?.code) {
    discardCallbackArtifacts();
    throw new AuthError("MISSING_CODE", "No authorization code was returned.");
  }

  const pkce = readJson(PKCE_KEY);
  if (!pkce?.codeVerifier) {
    discardCallbackArtifacts();
    throw new AuthError(
      "MISSING_VERIFIER",
      "Your sign-in session expired before it could be completed. Please sign in again.",
    );
  }

  if (pkce.state !== callback.state) {
    discardCallbackArtifacts();
    throw new AuthError(
      "STATE_MISMATCH",
      "Sign-in response could not be validated. Please sign in again.",
    );
  }

  if (inflightExchange?.code === callback.code) {
    return inflightExchange.promise;
  }

  const existing = readSession();
  if (existing && !isSessionExpired(existing)) {
    discardCallbackArtifacts();
    return existing;
  }

  const promise = exchangeAuthorizationCode(callback, pkce);
  inflightExchange = { code: callback.code, promise };

  try {
    return await promise;
  } catch (err) {
    // Network failures may not have consumed the code. Keep PKCE so a retry
    // can still complete. invalid_grant / provider errors are unrecoverable.
    if (!(err instanceof AuthError && err.code === "NETWORK")) {
      discardCallbackArtifacts();
    }
    throw err;
  } finally {
    if (inflightExchange?.code === callback.code) {
      inflightExchange = null;
    }
  }
}

// ---------- session / refresh ----------

async function refreshSession(previous) {
  if (!previous?.refreshToken) return null;
  try {
    const tokens = await requestTokens({
      grant_type: "refresh_token",
      client_id: cognitoConfig.clientId,
      refresh_token: previous.refreshToken,
    });
    const session = toSession(tokens, previous);
    writeSession(session);
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function isSessionExpired(session) {
  if (!session?.accessToken) return true;
  if (session.expiresAt && session.expiresAt <= Date.now() + 30_000) return true;
  return isJwtExpired(decodeJwtPayload(session.accessToken));
}

/** Returns a valid session (refreshing if possible), or null. */
export async function getValidSession() {
  const session = readSession();
  if (!session) return null;
  if (!isSessionExpired(session)) return session;
  return refreshSession(session);
}

/** Access token for API calls, or null when signed out / expired. */
export async function getAccessToken() {
  const session = await getValidSession();
  return session?.accessToken || null;
}

// ---------- user profile (display only) ----------

export function buildUserProfile(session) {
  const idClaims = decodeJwtPayload(session?.idToken) || {};
  const accessClaims = decodeJwtPayload(session?.accessToken) || {};
  const groups =
    idClaims["cognito:groups"] || accessClaims["cognito:groups"] || [];
  const username =
    idClaims["cognito:username"] || accessClaims.username || null;
  const email = idClaims.email || null;

  return {
    email,
    username,
    displayName: email || username || "Authenticated user",
    groups,
    role: resolveRole(groups),
    subject: idClaims.sub || accessClaims.sub || null,
  };
}

// ---------- logout ----------

export function logout() {
  clearSession();
  inflightExchange = null;
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: cognitoConfig.logoutUri,
  });
  window.location.assign(`${cognitoEndpoints.logout}?${params.toString()}`);
}
