import { useEffect, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import TopHeader from "./TopHeader.jsx";

export default function AppShell({
  user,
  onLogout,
  activePage,
  onNavigate,
  apiStatus,
  navBadges,
  children,
}) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const navigate = (page) => {
    onNavigate(page);
    setNavOpen(false);
  };

  return (
    <div className="shell">
      {navOpen && <div className="shell__scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        apiStatus={apiStatus}
        badges={navBadges}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="shell__main">
        <TopHeader user={user} onLogout={onLogout} onOpenNav={() => setNavOpen(true)} />
        <main className="shell__content" id="main">
          {children}
        </main>
      </div>
    </div>
  );
}
