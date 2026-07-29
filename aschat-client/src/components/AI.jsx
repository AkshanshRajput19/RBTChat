import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import "./AI.css";

const STORAGE_KEY = "rbtchatAiConversations";

const QUICK_PROMPTS = [
  "Explain this bug in simple words.",
  "Write a React component for a pricing card.",
  "Summarize the key points of a long message.",
  "Help me plan my next project steps.",
];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createConversation = () => {
  const timestamp = new Date().toISOString();

  return {
    id: createId(),
    title: "New Chat",
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
  };
};

const normalizeStoredConversations = (value) => {
  if (!Array.isArray(value)) {
    return [createConversation()];
  }

  const normalized = value
    .filter((conversation) => conversation && typeof conversation === "object")
    .map((conversation) => ({
      id: String(conversation.id || createId()),
      title: String(conversation.title || "New Chat"),
      createdAt: String(conversation.createdAt || new Date().toISOString()),
      updatedAt: String(conversation.updatedAt || conversation.createdAt || new Date().toISOString()),
      messages: Array.isArray(conversation.messages)
        ? conversation.messages
            .filter((message) => message && typeof message === "object")
            .map((message) => ({
              id: String(message.id || createId()),
              role: String(message.role || "assistant"),
              content: String(message.content || message.text || ""),
              createdAt: String(message.createdAt || new Date().toISOString()),
              meta: message.meta && typeof message.meta === "object" ? message.meta : {},
            }))
            .filter((message) => message.content.trim())
        : [],
    }))
    .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));

  return normalized.length ? normalized : [createConversation()];
};

const loadConversations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [createConversation()];
    }

    return normalizeStoredConversations(JSON.parse(raw));
  } catch {
    return [createConversation()];
  }
};

const buildTitle = (text) =>
  text
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(" ")
    .replace(/[.,!?;:]+$/, "") || "New Chat";

const getConversationPreview = (conversation) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  if (!lastMessage) {
    return "Start a new AI conversation";
  }

  return lastMessage.content.slice(0, 70);
};

const formatTime = (value) => {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const upsertConversation = (conversations, nextConversation) =>
  [nextConversation, ...conversations.filter((conversation) => conversation.id !== nextConversation.id)].sort(
    (first, second) => new Date(second.updatedAt) - new Date(first.updatedAt)
  );

export default function AI({ currentUser }) {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [serviceWarning, setServiceWarning] = useState("");
  const [config, setConfig] = useState(null);
  const [selectedModel, setSelectedModel] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (!activeConversationId && conversations[0]?.id) {
      setActiveConversationId(conversations[0].id);
      return;
    }

    if (!conversations.some((conversation) => conversation.id === activeConversationId)) {
      setActiveConversationId(conversations[0]?.id || createConversation().id);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await api.get("/ai/config");
        setConfig(data);
        setSelectedModel((currentModel) => currentModel || data?.model || "");
      } catch {
        setError("I could not load the Gemini backend config.");
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, isSending]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0],
    [activeConversationId, conversations]
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = `${conversation.title} ${getConversationPreview(conversation)}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [conversations, searchQuery]);

  const syncConversation = (conversation) => {
    setConversations((previous) => upsertConversation(previous, conversation));
    setActiveConversationId(conversation.id);
  };

  const handleNewChat = () => {
    const nextConversation = createConversation();
    setError("");
    setServiceWarning("");
    setInput("");
    syncConversation(nextConversation);
  };

  const handleSend = async (forcedPrompt) => {
    const prompt = String(forcedPrompt ?? input).trim();

    if (!prompt || isSending) {
      return;
    }

    setError("");

    const now = new Date().toISOString();
    const baseConversation = activeConversation || createConversation();
    const userMessage = {
      id: createId(),
      role: "user",
      content: prompt,
      createdAt: now,
      meta: {},
    };

    const optimisticConversation = {
      ...baseConversation,
      title: baseConversation.title === "New Chat" ? buildTitle(prompt) : baseConversation.title,
      updatedAt: now,
      messages: [...baseConversation.messages, userMessage],
    };

    syncConversation(optimisticConversation);
    setInput("");
    setIsSending(true);

    try {
      const { data } = await api.post("/ai/chat", {
        messages: optimisticConversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        model: selectedModel || undefined,
        currentUserName: currentUser?.name || currentUser?.email || "User",
      });

      const assistantMessage = {
        id: createId(),
        role: "assistant",
        content: String(data?.answer || "I did not receive a reply from the Gemini service."),
        createdAt: new Date().toISOString(),
        meta: {
          provider: data?.provider,
          model: data?.model,
          mode: data?.mode,
        },
      };

      syncConversation({
        ...optimisticConversation,
        title: String(data?.title || optimisticConversation.title),
        updatedAt: assistantMessage.createdAt,
        messages: [...optimisticConversation.messages, assistantMessage],
      });

      if (data?.warning) {
        setServiceWarning(String(data.warning));
      } else {
        setServiceWarning("");
      }

      if (data?.provider || data?.model || typeof data?.configured === "boolean") {
        setConfig((currentConfig) => ({
          ...(currentConfig || {}),
          configured: typeof data?.configured === "boolean" ? data.configured : currentConfig?.configured,
          provider: data?.provider || currentConfig?.provider,
          model: data?.model || currentConfig?.model,
          mode: data?.mode || currentConfig?.mode,
          availableProviders: currentConfig?.availableProviders || [],
        }));
      }
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        "I could not reach the Gemini backend. Check the server and Gemini key setup.";

      const failureReply = {
        id: createId(),
        role: "assistant",
        content: message,
        createdAt: new Date().toISOString(),
        meta: {
          mode: "error",
        },
      };

      syncConversation({
        ...optimisticConversation,
        updatedAt: failureReply.createdAt,
        messages: [...optimisticConversation.messages, failureReply],
      });
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`ai-page ${document.documentElement.dataset.theme === "light" ? "light" : "dark"}`}>
      <div className="ai-container">
        <aside className="ai-sidebar">
          <button className="new-chat-btn" type="button" onClick={handleNewChat}>
            + New Chat
          </button>

          <input
            className="chat-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search chats..."
          />

          <div className="ai-provider-card">
            <div className={`ai-status-dot ${config?.configured ? "online" : "offline"}`}></div>
            <div>
              <strong>{config?.configured ? "Gemini connected" : "Gemini key needed"}</strong>
              <p>
                {config?.configured
                  ? `Gemini · ${config?.model || "default model"}`
                  : "Add GEMINI_API_KEY or GOOGLE_API_KEY"}
              </p>
            </div>
          </div>

          <div className="chat-history">
            <p className="history-title">Recent Chats</p>

            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`history-item ${conversation.id === activeConversation?.id ? "active" : ""}`}
                onClick={() => {
                  setActiveConversationId(conversation.id);
                  setError("");
                }}
              >
                <span className="history-item-title">{conversation.title}</span>
                <span className="history-item-preview">{getConversationPreview(conversation)}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="ai-main">
          <div className="ai-header">
            <div>
              <h1>RBT AI</h1>
              <p>
                {config?.configured
                  ? "Ask coding, research, planning, or general questions."
                  : "The UI is ready. Connect Gemini to turn this into a real AI app."}
              </p>
            </div>

            <div className="ai-controls">
              <label className="ai-control">
                <span>Provider</span>
                <input value="Gemini" readOnly />
              </label>

              <label className="ai-control">
                <span>Model</span>
                <input
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  placeholder="Gemini model name"
                />
              </label>
            </div>
          </div>

          {!config?.configured && (
            <div className="ai-banner warning">
              Add `GEMINI_API_KEY` or `GOOGLE_API_KEY` in `aschat-server/.env.local`, then
              restart the backend.
            </div>
          )}

          {serviceWarning && <div className="ai-banner info">{serviceWarning}</div>}
          {error && <div className="ai-banner error">{error}</div>}

          <div className="messages">
            {!activeConversation?.messages?.length ? (
              <div className="ai-welcome">
                <div className="ai-logo">AI</div>
                <h2>How can I help you today?</h2>
                <p>
                  This page now talks to Gemini through the backend. Type a prompt and keep your
                  full chat history in the sidebar.
                </p>

                <div className="suggestions">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="suggestion"
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeConversation.messages.map((message) => (
                <div key={message.id} className={`message-row ${message.role}`}>
                  <div className={`message ${message.role}`}>
                    <div className="message-role">{message.role === "user" ? "You" : "RBT AI"}</div>
                    <div className="message-content">{message.content}</div>
                    <div className="message-meta">
                      <span>{formatTime(message.createdAt)}</span>
                      {message.meta?.provider && <span>{message.meta.provider}</span>}
                      {message.meta?.model && <span>{message.meta.model}</span>}
                      {message.meta?.mode === "local-fallback" && <span>Fallback Mode</span>}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isSending && (
              <div className="message-row assistant">
                <div className="message assistant typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          <div className="composer">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              rows={1}
            />

            <button className="send" type="button" onClick={() => handleSend()} disabled={isSending}>
              {isSending ? "..." : "Send"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
