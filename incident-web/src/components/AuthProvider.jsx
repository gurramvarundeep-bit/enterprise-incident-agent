import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../hooks/useAuth.js";
import {
  buildUserProfile,
  clearSession,
  completeLoginFromRedirect,
  getAccessToken,
  getValidSession,
  hasAuthCallbackParams,
  logout as cognitoLogout,
  startLogin,
} from "../services/authService.js";

// Survives StrictMode remounts. Never reset while a callback exchange is
// in flight — that is what previously allowed a second attempt after the
// verifier had already been consumed.
let bootstrapPromise = null;

async function bootstrap() {
  if (hasAuthCallbackParams()) {
    return completeLoginFromRedirect();
  }
  return getValidSession();
}

export default function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading"); // loading | authenticated | unauthenticated
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    bootstrapPromise ??= bootstrap();

    bootstrapPromise
      .then((session) => {
        if (cancelled) return;
        if (session) {
          setUser(buildUserProfile(session));
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Sign-in failed. Please try again.");
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    setError(null);
    try {
      await startLogin();
    } catch {
      setError("Could not start the sign-in flow. Please try again.");
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
    bootstrapPromise = null;
    cognitoLogout();
  }, []);

  /** Marks the session as expired locally; used when the API rejects a token. */
  const expireSession = useCallback(() => {
    clearSession();
    bootstrapPromise = null;
    setUser(null);
    setError("Your session has expired. Please sign in again.");
    setStatus("unauthenticated");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      status,
      user,
      error,
      isAuthenticated: status === "authenticated",
      login,
      logout,
      expireSession,
      getAccessToken,
      clearError,
    }),
    [status, user, error, login, logout, expireSession, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
