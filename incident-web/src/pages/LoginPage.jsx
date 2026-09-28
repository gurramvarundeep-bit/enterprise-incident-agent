import { Hexagon, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import Notice from "../components/ui/Notice.jsx";

const BADGES = ["Amazon Cognito", "AWS AgentCore", "Amazon Bedrock", "MCP"];

const FLOW = [
  "Cognito sign-in (PKCE)",
  "AgentCore Runtime",
  "Strands agent + Bedrock",
  "MCP tools + approvals",
];

export default function LoginPage({ onLogin, error, onDismissError, busy }) {
  return (
    <main className="login">
      <section className="login__card" aria-labelledby="login-title">
        <div className="login__brand">
          <div className="brand-mark" aria-hidden="true">
            <Hexagon size={22} strokeWidth={2.2} />
          </div>
          <div className="brand-text">
            <strong>IncidentAI</strong>
            <span>Enterprise Operations</span>
          </div>
        </div>

        <h1 id="login-title">Enterprise Agentic Incident Management Platform</h1>
        <p className="login__tagline">Secure AI-powered operations and incident response</p>

        {error && (
          <Notice
            tone="danger"
            title="Sign-in problem"
            action={
              <button type="button" className="btn btn--ghost btn--sm" onClick={onDismissError}>
                Dismiss
              </button>
            }
          >
            {error}
          </Notice>
        )}

        <button type="button" className="btn btn--primary btn--lg login__cta" onClick={onLogin} disabled={busy}>
          <KeyRound size={18} aria-hidden="true" />
          {busy ? "Redirecting to Cognito…" : "Sign in with Cognito"}
        </button>

        <ul className="login__badges" aria-label="Platform components">
          {BADGES.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="login__security">
          <div>
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Authorization Code + PKCE. No client secret in the browser.</span>
          </div>
          <div>
            <LockKeyhole size={16} aria-hidden="true" />
            <span>Role checks and approvals are enforced by the backend, not the UI.</span>
          </div>
        </div>
      </section>

      <aside className="login__side" aria-label="Architecture overview">
        <p className="eyebrow">Request path</p>
        <ol className="login__flow">
          {FLOW.map((step, i) => (
            <li key={step}>
              <span className="login__flow-index">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="login__side-note">
          Sensitive actions such as service restarts require role authorization and may be
          held for Incident Manager approval in the DynamoDB workflow.
        </p>
      </aside>
    </main>
  );
}
