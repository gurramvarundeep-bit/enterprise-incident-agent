import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import DemoDataBadge from "../components/ui/DemoDataBadge.jsx";
import { demoRunbooks } from "../data/demoData.js";

export default function RunbooksPage({ onAskAgent }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demoRunbooks;
    return demoRunbooks.filter((rb) =>
      [rb.title, rb.service, rb.category, rb.summary, ...rb.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <div className="page">
      <PageHeader
        title="Runbooks"
        description="Operational procedures the agent can retrieve during an investigation."
        meta={<DemoDataBadge />}
      />

      <div className="search">
        <Search size={16} aria-hidden="true" />
        <label htmlFor="runbook-search" className="sr-only">Search runbooks</label>
        <input
          id="runbook-search"
          type="search"
          placeholder="Search by service, tag, or keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="search__count">{results.length} of {demoRunbooks.length}</span>
      </div>

      {results.length === 0 ? (
        <div className="empty">No sample runbooks match "{query}".</div>
      ) : (
        <div className="runbook-grid">
          {results.map((rb) => (
            <article key={rb.id} className="runbook-card">
              <header>
                <span className="runbook-card__icon" aria-hidden="true"><BookOpen size={16} /></span>
                <div>
                  <span className="runbook-card__id">{rb.id} · {rb.category}</span>
                  <h3>{rb.title}</h3>
                </div>
              </header>
              <p>{rb.summary}</p>
              <ul className="tags" aria-label="Tags">
                {rb.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <footer>
                <span className="text-muted">{rb.steps} steps · updated {rb.updatedAt}</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onAskAgent(`Find the runbook for: ${rb.title}.`)}
                >
                  Ask agent
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
