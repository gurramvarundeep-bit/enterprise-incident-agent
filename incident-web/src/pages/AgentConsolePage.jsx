import AgentConsole from "../components/chat/AgentConsole.jsx";
import ExecutionContextPanel from "../components/ExecutionContextPanel.jsx";
import ServiceHealthCard from "../components/ServiceHealthCard.jsx";
import { services } from "../data/demoData.js";

export default function AgentConsolePage({ chat, user, isAuthenticated, draft }) {
  return (
    <div className="console-page">
      <section className="health-strip" aria-label="Service health snapshot">
        {services.map((s) => (
          <ServiceHealthCard key={s.id} service={s} />
        ))}
        <span className="health-strip__note">Reference snapshot · ask the agent for live status</span>
      </section>

      <div className="workspace">
        <AgentConsole chat={chat} viewerRole={user?.role} draft={draft} />
        <ExecutionContextPanel
          user={user}
          isAuthenticated={isAuthenticated}
          apiStatus={chat.apiStatus}
          sessionId={chat.sessionId}
        />
      </div>
    </div>
  );
}
