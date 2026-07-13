import { useEffect, useState } from "react";
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

function SubscriptionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function AllSubscriptionsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6h14M5 12h14M5 18h10" />
    </svg>
  );
}

function PendingRequestsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8v4l2 2M4 12a8 8 0 1 1 8 8" />
    </svg>
  );
}

function PlansIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16v4H4zM4 13h16v4H4z" />
    </svg>
  );
}

function AddPlanIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PwaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 18V6h14v12H5zM9 8h6M9 12h6" />
    </svg>
  );
}

function PaymentHistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h10M4 17h16M20 4v16" />
    </svg>
  );
}

function SettingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 8.6a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9z" />
    </svg>
  );
}

function CustomDomainIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12a8 8 0 0 1 16 0 8 8 0 0 1-16 0z" />
      <path d="M2 12h20M12 2a16 16 0 0 1 0 20M12 2a16 16 0 0 0 0 20" />
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

  const [showSubscriptionMenu, setShowSubscriptionMenu] = useState(false);
  const subscriptionPages = [
    "subscription",
    "allSubscriptions",
    "pendingRequests",
    "plans",
    "addPlan",
    "pwaSettings",
    "paymentHistory",
    "setting",
    "customDomain",
  ];

  useEffect(() => {
    if (!subscriptionPages.includes(activePage)) {
      setShowSubscriptionMenu(false);
    }
  }, [activePage]);

  const handleSubscriptionToggle = () => {
    if (showSubscriptionMenu) {
      setShowSubscriptionMenu(false);
      return;
    }
    setShowSubscriptionMenu(true);
    navigate("subscription");
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

          <div className="sidebar-section">
            <button
              className={activePage === "subscription" ? "active" : ""}
              onClick={handleSubscriptionToggle}
            >
              <SubscriptionIcon />
              <span>Subscription Management</span>
            </button>
            {showSubscriptionMenu && (
              <div className="sidebar-submenu">
                <button
                  className={activePage === "allSubscriptions" ? "active" : ""}
                  onClick={() => navigate("allSubscriptions")}
                >
                  <AllSubscriptionsIcon />
                  <span>All Subscriptions</span>
                </button>
                <button
                  className={activePage === "pendingRequests" ? "active" : ""}
                  onClick={() => navigate("pendingRequests")}
                >
                  <PendingRequestsIcon />
                  <span>Pending Requests</span>
                </button>
                <button
                  className={activePage === "plans" ? "active" : ""}
                  onClick={() => navigate("plans")}
                >
                  <PlansIcon />
                  <span>Plans / Packages</span>
                </button>
                <button
                  className={activePage === "addPlan" ? "active" : ""}
                  onClick={() => navigate("addPlan")}
                >
                  <AddPlanIcon />
                  <span>Add Plan</span>
                </button>
                <button
                  className={activePage === "pwaSettings" ? "active" : ""}
                  onClick={() => navigate("pwaSettings")}
                >
                  <PwaIcon />
                  <span>PWA Settings</span>
                </button>
                <button
                  className={activePage === "paymentHistory" ? "active" : ""}
                  onClick={() => navigate("paymentHistory")}
                >
                  <PaymentHistoryIcon />
                  <span>Payment History</span>
                </button>
                <button
                  className={activePage === "setting" ? "active" : ""}
                  onClick={() => navigate("setting")}
                >
                  <SettingIcon />
                  <span>Setting</span>
                </button>
                <button
                  className={activePage === "customDomain" ? "active" : ""}
                  onClick={() => navigate("customDomain")}
                >
                  <CustomDomainIcon />
                  <span>Custom Domain</span>
                </button>
              </div>
            )}
          </div>

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
