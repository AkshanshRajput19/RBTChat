import { useEffect, useRef, useState } from "react";
import { getPageTitle, getSettingsPageForSection } from "./settingsSections";
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

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ChatsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.8 8.8 0 0 1-3.9-.9L3 21l1.9-5.2A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

function AiIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
      <path d="M6 16l.8 1.7L8.5 19l-1.7.8L6 21.5l-.8-1.7L3.5 19l1.7-.8L6 16Z" />
      <path d="M18 15l1 2.1L21 18l-2 .9-1 2.1-1-2.1-2-.9 2-.9 1-2.1Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 18H9" />
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.1 9a3 3 0 1 1 5.8 1c-.5 1.3-1.9 1.9-2.6 2.8-.4.5-.5.9-.5 1.7" />
      <path d="M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 0 18h1.2a2.3 2.3 0 0 0 0-4.6H12a1.8 1.8 0 0 1-1.8-1.8A1.8 1.8 0 0 1 12 12h1.5A4.5 4.5 0 0 0 18 7.5 4.5 4.5 0 0 0 13.5 3H12Z" />
      <circle cx="7.5" cy="10" r="1" />
      <circle cx="9.5" cy="7.2" r="1" />
      <circle cx="13" cy="6.5" r="1" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`dashboard-chevron ${open ? "open" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
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
  onNavigate,
  onLogout,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const menuRef = useRef(null);
  const initials = currentUser.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsAppearanceOpen(false);
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
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
    closeMenu();
  }, [page]);

  const handleThemeChange = (nextTheme) => {
    onThemeChange(nextTheme);
    closeMenu();
  };

  const navigateTo = (nextPage) => {
    onNavigate(nextPage);
    closeMenu();
  };

  const handleLogoutClick = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      closeMenu();
      onLogout?.();
    }
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
          <h1>{getPageTitle(page)}</h1>
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
            <div className="dashboard-user-info">
              <strong>{currentUser.name}</strong>
              <span>{currentUser.email}</span>
            </div>

            <hr />

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={() => navigateTo(getSettingsPageForSection("profile"))}
            >
              <ProfileIcon />
              <span>Profile</span>
            </button>

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={() => navigateTo(getSettingsPageForSection("account"))}
            >
              <AccountIcon />
              <span>Account</span>
            </button>

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={() => navigateTo(getSettingsPageForSection("privacy"))}
            >
              <PrivacyIcon />
              <span>Privacy</span>
            </button>

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={() => navigateTo(getSettingsPageForSection("chats"))}
            >
              <ChatsIcon />
              <span>Chats</span>
            </button>

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={() => navigateTo(getSettingsPageForSection("ai"))}
            >
              <AiIcon />
              <span>AI Settings</span>
            </button>

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={() => navigateTo(getSettingsPageForSection("notifications"))}
            >
              <BellIcon />
              <span>Notifications</span>
            </button>

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={() => navigateTo(getSettingsPageForSection("help"))}
            >
              <HelpIcon />
              <span>Help &amp; Feedback</span>
            </button>

            <hr />

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={handleLogoutClick}
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>

            <button
              type="button"
              className="dashboard-theme-option"
              onClick={() => setIsAppearanceOpen((open) => !open)}
              aria-expanded={isAppearanceOpen}
            >
              <PaletteIcon />
              <span>Appearance</span>
              <span className="dashboard-theme-tail">
                <ChevronIcon open={isAppearanceOpen} />
              </span>
            </button>

            {isAppearanceOpen && (
              <>
                <button
                  type="button"
                  className={`dashboard-theme-option dashboard-theme-child ${
                    theme === "light" ? "active" : ""
                  }`}
                  onClick={() => handleThemeChange("light")}
                >
                  <SunIcon />
                  <span>Light Mode</span>
                </button>

                <button
                  type="button"
                  className={`dashboard-theme-option dashboard-theme-child ${
                    theme === "dark" ? "active" : ""
                  }`}
                  onClick={() => handleThemeChange("dark")}
                >
                  <MoonIcon />
                  <span>Dark Mode</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
