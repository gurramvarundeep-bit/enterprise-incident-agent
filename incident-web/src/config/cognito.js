// Public Cognito configuration for the browser (PKCE) app client.
// These values are NOT secrets: pool id, public client id, and hosted-UI domain
// are safe to ship in a browser bundle. The client has no secret by design.
const env = import.meta.env;

const origin = typeof window !== "undefined" ? window.location.origin : "";

export const cognitoConfig = {
  region: env.VITE_COGNITO_REGION || "us-east-1",
  userPoolId: env.VITE_COGNITO_USER_POOL_ID || "us-east-1_QKD4W40Qb",
  clientId: env.VITE_COGNITO_CLIENT_ID || "475qi4675rg4kl7ask2m52ai1a",
  domain:
    env.VITE_COGNITO_DOMAIN ||
    "us-east-1qkd4w40qb.auth.us-east-1.amazoncognito.com",
  scopes: ["openid", "email"],
  // Defaults to the current origin so the same build works on localhost and
  // after deployment, as long as the URL is registered in Cognito.
  redirectUri: env.VITE_COGNITO_REDIRECT_URI || `${origin}/`,
  logoutUri: env.VITE_COGNITO_LOGOUT_URI || `${origin}/`,
};

const base = `https://${cognitoConfig.domain}`;

export const cognitoEndpoints = {
  authorize: `${base}/oauth2/authorize`,
  token: `${base}/oauth2/token`,
  logout: `${base}/logout`,
};
