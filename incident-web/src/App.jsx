import { useCallback, useState } from "react";
import { Hexagon } from "lucide-react";
import { useAuth } from "./hooks/useAuth.js";
import { useAgentChat } from "./hooks/useAgentChat.js";
import AppShell from "./components/layout/AppShell.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AgentConsolePage from "./pages/AgentConsolePage.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import ApprovalsPage from "./pages/ApprovalsPage.jsx";
import ServiceHealthPage from "./pages/ServiceHealthPage.jsx";
import RunbooksPage from "./pages/RunbooksPage.jsx";
import { createId } from "./utils/format.js";

function Splash({ label }) {
  return (
    <div className="splash" role="status" aria-live="polite">
      <div className="brand-mark brand-mark--lg" aria-hidden="true">
        <Hexagon size={28} strokeWidth={2.2} />
      </div>
      <p>{label}</p>
    </div>
  );
}

function AuthenticatedApp({ auth }) {
  const { user, logout, getAccessToken, expireSession } = auth;
  const [page, setPage] = useState("console");
  const [draft, setDraft] = useState(null);

  const chat = useAgentChat({ getAccessToken, onUnauthorized: expireSession });

  // Other pages hand a prompt to the console instead of calling the API directly,
  // so every backend interaction goes through one audited path.
  const askAgent = useCallback((prompt) => {
    setDraft({ id: createId(), text: prompt });
    setPage("console");
  }, []);

  const approve = useCallback(
    (approval) => {
      chat.send(`Approve request ${approval.approvalId} (${approval.action} on ${approval.service}).`);
      setPage("console");
    },
    [chat],
  );

  const pendingLive = chat.liveApprovals.filter((a) => a.status === "APPROVAL_REQUIRED").length;

  let content;
  switch (page) {
    case "incidents":
      content = <IncidentsPage onAskAgent={askAgent} />;
      break;
    case "approvals":
      content = (
        <ApprovalsPage
          liveApprovals={chat.liveApprovals}
          viewerRole={user?.role}
          onApprove={approve}
          busy={chat.isSending}
        />
      );
      break;
    case "health":
      content = <ServiceHealthPage onAskAgent={askAgent} />;
      break;
    case "runbooks":
      content = <RunbooksPage onAskAgent={askAgent} />;
      break;
    default:
      content = (
        <AgentConsolePage chat={chat} user={user} isAuthenticated draft={draft} />
      );
  }

  return (
    <AppShell
      user={user}
      onLogout={logout}
      activePage={page}
      onNavigate={setPage}
      apiStatus={chat.apiStatus}
      navBadges={{ approvals: pendingLive }}
    >
      {content}
    </AppShell>
  );
}

export default function App() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);

  if (auth.status === "loading") {
    return <Splash label="Completing secure sign-in…" />;
  }

  if (!auth.isAuthenticated) {
    return (
      <LoginPage
        onLogin={async () => {
          setBusy(true);
          await auth.login();
          setBusy(false);
        }}
        busy={busy}
        error={auth.error}
        onDismissError={auth.clearError}
      />
    );
  }

  return <AuthenticatedApp auth={auth} />;
}
