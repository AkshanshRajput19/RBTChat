import "./DashboardLayout.css";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 11.4a8.4 8.4 0 0 1-9 8.4 10 10 0 0 1-3.8-.8L3 21l1.7-4.6A8.4 8.4 0 1 1 21 11.4Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StoriesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M7 4v4M17 4v4M6 20h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </svg>
  );
}

function Sidebar({ activePage, isOpen, onNavigate, onLogout, onClose }) {
  const navigate = (page) => {
    onNavigate(page);
  };

  return (
    <>
      <button
        className={`sidebar-backdrop ${isOpen ? "visible" : ""}`}
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside className={`dashboard-sidebar ${isOpen ? "open" : ""}`}>
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">RC</div>
          <div>
            <strong>RBTChat</strong>
            <span>Connect instantly</span>
          </div>
        </div>

        <nav className="dashboard-navigation" aria-label="Main navigation">
          <p className="navigation-label">FEATURES</p>

          <button
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => navigate("dashboard")}
          >
            <DashboardIcon />
            <span>Dashboard</span>
          </button>

          <button
            className={activePage === "chats" ? "active" : ""}
            onClick={() => navigate("chats")}
          >
            <ChatIcon />
            <span>Chats</span>
          </button>

          <button
            className={activePage === "users" ? "active" : ""}
            onClick={() => navigate("users")}
          >
            <UsersIcon />
            <span>Users</span>
          </button>

          <button
            className={activePage === "stories" ? "active" : ""}
            onClick={() => navigate("stories")}
          >
            <StoriesIcon />
            <span>Stories</span>
          </button>
        </nav>

        <div className="dashboard-sidebar-footer">
          <button className="dashboard-logout" onClick={onLogout}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
