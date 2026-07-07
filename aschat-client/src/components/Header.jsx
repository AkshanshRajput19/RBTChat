import "./DashboardLayout.css";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function Header({ currentUser, page, isSidebarOpen, onMenuClick }) {
  const initials = currentUser.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-title">
        <button
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isSidebarOpen}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <MenuIcon />
        </button>

        <div>
          <p>RBTChat workspace</p>
          <h1>
            {page === "dashboard"
              ? "Dashboard"
              : page === "users"
                ? "Users"
                : "Chats"}
          </h1>
        </div>
      </div>

      <div className="dashboard-user">
        <div className="dashboard-user-copy">
          <strong>{currentUser.name}</strong>
          <span>Online</span>
        </div>
        <div className="dashboard-user-avatar">{initials}</div>
      </div>
    </header>
  );
}

export default Header;
