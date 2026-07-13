import { useEffect, useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Users from "./components/Users";
import api from "./api";
import { connectSocket, disconnectSocket } from "./socket";
import "./components/DashboardLayout.css";

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth > 900
  );
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rbtchatSession"));
    } catch {
      return null;
    }
  });
  const [socket, setSocket] = useState(null);

  const resetSessionState = () => {
    localStorage.removeItem("rbtchatSession");
    setSession(null);
    setShowLogin(true);
    setActivePage("dashboard");
    setIsSidebarOpen(window.innerWidth > 900);
  };

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
          />

          <div className="dashboard-content">
            {activePage === "dashboard" ? (
              <Dashboard
                currentUser={session.user}
                onOpenChats={() => setActivePage("chats")}
              />
            ) : activePage === "users" ? (
              <Users currentUser={session.user} />
            ) : (
              <Chat currentUser={session.user} socket={socket} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return showLogin ? (
    <Login
      setShowLogin={setShowLogin}
      onAuth={handleAuth}
    />
  ) : (
    <Register
      setShowLogin={setShowLogin}
      onAuth={handleAuth}
    />
  );
}

export default App;
