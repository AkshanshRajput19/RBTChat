import "./Tools.css";

const tools = [
  { label: "RBT Verified", description: "Verified user tools and status." },
  { label: "AI Agent", description: "Configure your AI assistant settings." },
  { label: "Catalogue", description: "Manage your listed products and services." },
  { label: "Advertise", description: "Create and manage ad campaigns." },
  { label: "Payments", description: "View payment options and history." },
  { label: "Lists", description: "Organize lists for quick access." },
  { label: "Greeting Messages", description: "Set welcome messages for new chats." },
  { label: "Away Messages", description: "Configure auto-replies when offline." },
  { label: "Quick Replies", description: "Save canned responses for fast replies." },
];

function Tools() {
  return (
    <div className="tools-page">
      <div className="tools-header">
        <div>
          <h1>Tools</h1>
          <p>Quick access to your most important workspace tools.</p>
        </div>
      </div>

      <div className="tools-grid">
        {tools.map((tool) => (
          <button key={tool.label} type="button" className="tools-card">
            <strong>{tool.label}</strong>
            <span>{tool.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Tools;
