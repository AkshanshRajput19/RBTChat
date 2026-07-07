import "./DashboardLayout.css";

function Dashboard({ currentUser, onOpenChats }) {
  return (
    <section className="dashboard-home">
      <div className="dashboard-welcome-card">
        <div className="welcome-copy">
          <span className="welcome-kicker">WELCOME BACK</span>
          <h2>Hello, {currentUser.name}</h2>
          <p>Your conversations are ready whenever you are.</p>
          <button onClick={onOpenChats}>Open chats</button>
        </div>

        <div className="welcome-art" aria-hidden="true">
          <span className="welcome-art-bubble large">Hi!</span>
          <span className="welcome-art-bubble small">•••</span>
        </div>
      </div>

      <div className="dashboard-info-card">
        <div className="info-card-icon">RC</div>
        <div>
          <h3>RBTChat</h3>
          <p>Use the Chats section to find people and start a conversation.</p>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
