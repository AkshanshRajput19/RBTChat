import Settings from "./components/Settings";
import AI from "./components/AI";import FrontEnd from "./components/FrontEnd";import { useEffect, useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import PublicLanding from "./components/PublicLanding";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import SubscriptionManagement from "./components/SubscriptionManagement";
import Tools from "./components/Tools";
import Users from "./components/Users";
import { UNAUTHORIZED_EVENT } from "./api";
import { getSettingsSection, isSettingsLikePage } from "./components/settingsSections";
import { connectSocket, disconnectSocket } from "./socket";
import "./components/DashboardLayout.css";

const THEME_STORAGE_KEY = "rbtchatTheme";
const SUBSCRIPTION_PAGES = new Set([
  "subscription",
  "allSubscriptions",
  "pendingRequests",
  "plans",
  "addPlan",
  "pwaSettings",
  "paymentHistory",
  "customDomain",
]);

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
};

function App() {
  const [publicView, setPublicView] = useState("landing");
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth > 900
  );
  const [theme, setTheme] = useState(getInitialTheme);
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rbtchatSession"));
    } catch {
      return null;
    }
  });
  const [socket, setSocket] = useState(null);
  const [lastNonSettingsPage, setLastNonSettingsPage] = useState("dashboard");

  const settingsSection = getSettingsSection(activePage);
  const isSubscriptionPage = SUBSCRIPTION_PAGES.has(activePage);

  const resetSessionState = () => {
    localStorage.removeItem("rbtchatSession");
    setSession(null);
    setPublicView("landing");
    setActivePage("dashboard");
    setIsSidebarOpen(window.innerWidth > 900);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!isSettingsLikePage(activePage)) {
      setLastNonSettingsPage(activePage);
    }
  }, [activePage]);

  useEffect(() => {
    if (!session) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [publicView, session]);

  useEffect(() => {
    if (!session?.token) {
      disconnectSocket();
      setSocket(null);
      return undefined;
    }

    const activeSocket = connectSocket(session.token);
    setSocket(activeSocket);

    return () => {
      disconnectSocket();
    };
  }, [session?.token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      disconnectSocket();
      setSocket(null);
      resetSessionState();
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const handleAuth = (authData) => {
    const nextSession = {
      token: authData.token,
      user: authData.user,
    };

    localStorage.setItem("rbtchatSession", JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const handleLogout = () => {
    disconnectSocket();
    setSocket(null);
    resetSessionState();
  };

  const handleProfileUpdate = (userUpdates) => {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const nextSession = {
        ...currentSession,
        user: {
          ...currentSession.user,
          ...userUpdates,
        },
      };

      localStorage.setItem("rbtchatSession", JSON.stringify(nextSession));
      return nextSession;
    });
  };

  if (session) {
    return (
      <div className="dashboard-shell">
        <Sidebar
          activePage={activePage}
          isOpen={isSidebarOpen}
          onNavigate={setActivePage}
          onLogout={handleLogout}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="dashboard-main">
          <Header
  currentUser={session.user}
  page={activePage}
  isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
  theme={theme}
  onThemeChange={setTheme}
  onNavigate={setActivePage}
  onLogout={handleLogout}
/>

         <div className="dashboard-content">
  {activePage === "dashboard" ? (
    <Dashboard
      currentUser={session.user}
      onOpenChats={() => setActivePage("chats")}
    />
  ) : activePage === "users" ? (
    <Users currentUser={session.user} />
  ) : activePage === "ai" ? (
    <AI currentUser={session.user} />
  ) : activePage === "tools" ? (
    <Tools />
  ) : activePage === "frontend" ? (
    <FrontEnd />
  ) : isSubscriptionPage ? (
    <SubscriptionManagement
      currentUser={session.user}
      activePage={activePage}
      onNavigate={setActivePage}
    />
  ) : settingsSection ? (
    <Settings
      currentUser={session.user}
      section={settingsSection}
      returnPage={lastNonSettingsPage}
      theme={theme}
      onThemeChange={setTheme}
      onNavigate={setActivePage}
      onLogout={handleLogout}
      onProfileSave={handleProfileUpdate}
    />
  ) : (
    <Chat
      currentUser={session.user}
      socket={socket}
    />
  )}
</div>
        </div>
      </div>
    );
  }

  const setShowLogin = (shouldShowLogin) => {
    setPublicView(shouldShowLogin ? "login" : "register");
  };

  if (publicView === "landing") {
    return (
      <PublicLanding
        onLogin={() => setPublicView("login")}
        onRegister={() => setPublicView("register")}
        theme={theme}
        onThemeChange={setTheme}
      />
    );
  }

  return publicView === "login" ? (
    <Login
      setShowLogin={setShowLogin}
      onAuth={handleAuth}
      onReturnHome={() => setPublicView("landing")}
    />
  ) : (
    <Register
      setShowLogin={setShowLogin}
      onAuth={handleAuth}
      onReturnHome={() => setPublicView("landing")}
    />
  );
}

export default App;
