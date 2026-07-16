import { useEffect, useRef, useState } from "react";
import "./DashboardLayout.css";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3c0 5 3.79 8.79 8.79 8.79Z" />
    </svg>
  );
}

function Header({
  currentUser,
  page,
  isSidebarOpen,
  onMenuClick,
  theme,
  onThemeChange,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const initials = currentUser.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [page]);

  const handleThemeChange = (nextTheme) => {
    onThemeChange(nextTheme);
    setIsMenuOpen(false);
  };

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

        <div className="dashboard-user-menu" ref={menuRef}>
          <button
            type="button"
            className={`dashboard-user-trigger ${isMenuOpen ? "open" : ""}`}
            aria-label="Open profile menu"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <div className="dashboard-user-avatar">{initials}</div>
          </button>

          <div className={`dashboard-user-dropdown ${isMenuOpen ? "open" : ""}`}>
            <p className="dashboard-user-dropdown-label">Appearance</p>

            <button
              type="button"
              className={`dashboard-theme-option ${theme === "light" ? "active" : ""}`}
              aria-pressed={theme === "light"}
              onClick={() => handleThemeChange("light")}
            >
              <SunIcon />
              <span>Light mode</span>
            </button>

            <button
              type="button"
              className={`dashboard-theme-option ${theme === "dark" ? "active" : ""}`}
              aria-pressed={theme === "dark"}
              onClick={() => handleThemeChange("dark")}
            >
              <MoonIcon />
              <span>Dark mode</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
