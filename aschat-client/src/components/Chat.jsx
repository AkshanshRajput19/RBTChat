import { useEffect, useRef, useState } from "react";
import api from "../api";
import useWebRTCCall from "../hooks/useWebRTCCall";
import CallOverlay from "./CallOverlay";
import "./Chat.css";
const SERVER_ORIGIN =
import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
function Chat({ currentUser, socket }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [activeDeleteMenuId, setActiveDeleteMenuId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [conversationMode, setConversationMode] = useState("direct");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [showGroupAdminPanel, setShowGroupAdminPanel] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [predictedReplies, setPredictedReplies] = useState([]);
  const [isLoadingPredictive, setIsLoadingPredictive] = useState(false);
  const [userPatterns, setUserPatterns] = useState(null);
  const [contextualInsight, setContextualInsight] = useState(null);
  const messagesEndRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const call = useWebRTCCall({ socket, users });

  useEffect(() => {
    if (!socket) {
      setOnlineUserIds([]);
      return undefined;
    }

    const handleOnlineUsers = (userIds) => {
      setOnlineUserIds(userIds);
    };

    socket.on("online-users", handleOnlineUsers);
    socket.emit("get-online-users");

    return () => {
      socket.off("online-users", handleOnlineUsers);
    };
  }, [socket]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get("/users");
        const otherUsers = response.data.users.filter(
          (user) => user._id !== currentUser.id
        );

        setUsers(otherUsers);
        setSelectedUser((current) => current || otherUsers[0] || null);
      } catch {
        setError("Could not load users.");
      }
    };

    const loadGroups = async () => {
      try {
        const response = await api.get("/groups");
        setGroups(response.data.groups || []);
      } catch {
        setError("Could not load groups.");
      }
    };

    loadUsers();
    loadGroups();
  }, [currentUser.id]);

  useEffect(() => {
    if (conversationMode === "group") {
      if (!selectedGroup) {
        setMessages([]);
        return undefined;
      }

      let isActive = true;

      const loadMessages = async (showLoader = false) => {
        try {
          if (showLoader) setIsLoadingMessages(true);
          const response = await api.get(`/groups/${selectedGroup._id}/messages`);

          if (isActive) {
            setMessages(response.data.messages || []);
            setError("");
          }
        } catch {
          if (isActive) setError("Could not load this conversation.");
        } finally {
          if (isActive && showLoader) setIsLoadingMessages(false);
        }
      };

      setMessages([]);
      loadMessages(true);
      const pollingId = window.setInterval(() => loadMessages(false), 2000);

      return () => {
        isActive = false;
        window.clearInterval(pollingId);
      };
    }

    if (!selectedUser) {
      setMessages([]);
      return undefined;
    }

    let isActive = true;

    const loadMessages = async (showLoader = false) => {
      try {
        if (showLoader) setIsLoadingMessages(true);
        const response = await api.get(`/messages/${selectedUser._id}`);

        if (isActive) {
          setMessages(response.data.messages || []);
          setError("");
        }
      } catch {
        if (isActive) setError("Could not load this conversation.");
      } finally {
        if (isActive && showLoader) setIsLoadingMessages(false);
      }
    };

    setMessages([]);
    loadMessages(true);
    const pollingId = window.setInterval(() => loadMessages(false), 2000);

    return () => {
      isActive = false;
      window.clearInterval(pollingId);
    };
  }, [conversationMode, selectedUser, selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isRecording) return undefined;

    const timer = window.setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(
    () => () => {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name = "User") =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getLastMessage = (userId) => {
    if (selectedUser?._id !== userId || messages.length === 0) return null;
    return messages[messages.length - 1];
  };

  const getMessagePreview = (chatMessage) => {
    if (!chatMessage) return null;
    if (chatMessage.deletedForEveryone ||
      (chatMessage.deletedFor || []).some(
        (userId) => String(userId) === String(currentUser.id)
      )) {
      return "This message was deleted";
    }
    if (chatMessage.type === "voice") return "Voice message";
    if (chatMessage.type === "video") return "Video message";
    if (chatMessage.type === "image") return "Photo";
    if (chatMessage.type === "document") return "Document";
    if (chatMessage.type === "location") return "Location";
    return chatMessage.text;
  };

  const getMediaUrl = (mediaUrl) => {
    if (!mediaUrl) return "";
    return mediaUrl.startsWith("http")
      ? mediaUrl
      : `${SERVER_ORIGIN}${mediaUrl}`;
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const sendTextMessage = async (text, messageType = "text") => {
    if (!selectedUser || !text.trim() || isSending) return;

    try {
      setIsSending(true);
      setError("");
      const response = await api.post("/messages", {
        receiver: selectedUser._id,
        text: text.trim(),
        type: messageType,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        response.data.message,
      ]);
      setMessage("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Message could not be sent."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!selectedUser || !text || isSending) return;
    await sendTextMessage(text, "text");
  };

  const requestAiSuggestions = async () => {
    if (!selectedUser) return;

    try {
      setIsLoadingAi(true);
      setAiError("");
      const response = await api.post("/ai/suggestions", {
        userId: selectedUser._id,
        context: messages
          .slice(-8)
          .map((msg) => ({ sender: String(msg.sender?._id || msg.sender), text: msg.text || "" })),
        currentUserName: currentUser.name,
        targetUserName: selectedUser.name,
      });

      setAiSuggestions(response.data.suggestions || []);
      setAiAnalysis(response.data.chatFlowAnalysis || null);
    } catch (requestError) {
      setAiError(
        requestError.response?.data?.message ||
          "RBT-AI could not generate suggestions right now."
      );
      setAiSuggestions([]);
      setAiAnalysis(null);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const requestPredictiveSuggestions = async () => {
    if (!selectedUser) return;

    try {
      setIsLoadingPredictive(true);
      const response = await api.post("/ai/predictive", {
        targetUserId: selectedUser._id,
      });

      setPredictedReplies(response.data.predictedReplies || []);
      setUserPatterns(response.data.userPatterns || null);
      setContextualInsight(response.data.contextualInsight || null);
    } catch (error) {
      console.error("Predictive messaging error:", error);
      setPredictedReplies([]);
    } finally {
      setIsLoadingPredictive(false);
    }
  };

  // Load predictive suggestions when user is selected
  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      requestPredictiveSuggestions();
    }
  }, [selectedUser]);

  const sendMediaMessage = async (file, mediaType) => {
    if (!selectedUser || !file || isUploading) return;

    const formData = new FormData();
    formData.append("receiver", selectedUser._id);
    formData.append("mediaType", mediaType);
    formData.append("media", file);

    try {
      setIsUploading(true);
      setError("");
      const response = await api.post("/messages/media", formData);
      setMessages((currentMessages) => [
        ...currentMessages,
        response.data.message,
      ]);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `${mediaType === "voice" ? "Voice" : "Video"} message could not be sent.`
      );
    } finally {
      setIsUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleFileSelected = (event, mediaType) => {
    const [file] = event.target.files;
    setShowAttachMenu(false);

    if (file) {
      sendMediaMessage(file, mediaType);
    }
  };

  const handleShareLocation = async () => {
    setShowAttachMenu(false);

    if (!selectedUser) return;

    if (!navigator.geolocation) {
      setError("Location sharing is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        const locationText = `Shared a location: ${latitude}, ${longitude}`;
        await sendTextMessage(locationText, "location");
      },
      () => {
        setError("Location access was denied or unavailable.");
      }
    );
  };

  const isDeletedForCurrentUser = (chatMessage) => {
    if (!chatMessage) return false;

    return (
      chatMessage.deletedForEveryone ||
      (chatMessage.deletedFor || []).some(
        (userId) => String(userId) === String(currentUser.id)
      )
    );
  };

  const handleDeleteMessage = async (chatMessage, scope) => {
    if (!chatMessage || isUploading) return;

    try {
      setError("");
      const response = await api.delete(`/messages/${chatMessage._id}`, {
        params: { scope },
      });

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message._id === chatMessage._id ? response.data.message : message
        )
      );
      setActiveDeleteMenuId(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Message could not be deleted."
      );
    }
  };

  const startVoiceRecording = async () => {
    if (isRecording || isUploading) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);

      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, {
          type: mimeType,
        });

        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recordedChunksRef.current = [];

        if (blob.size > 0) {
          await sendMediaMessage(voiceFile, "voice");
        }
      };

      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      setError("");
      setShowAttachMenu(false);
    } catch (recordingError) {
      setError(
        recordingError.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Voice recording could not start."
      );
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const response = await api.post("/groups", {
        name: groupName.trim(),
        members: groupMemberIds,
      });

      setGroups((currentGroups) => [response.data.group, ...currentGroups]);
      setSelectedGroup(response.data.group);
      setConversationMode("group");
      setShowCreateGroup(false);
      setGroupName("");
      setGroupMemberIds([]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Group could not be created.");
    }
  };

  const addGroupMember = async () => {
    if (!selectedGroup || !newMemberId) return;

    try {
      const response = await api.post(`/groups/${selectedGroup._id}/members`, {
        userId: newMemberId,
      });

      setSelectedGroup(response.data.group);
      setGroups((currentGroups) =>
        currentGroups.map((group) =>
          group._id === response.data.group._id ? response.data.group : group
        )
      );
      setNewMemberId("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Member could not be added.");
    }
  };

  const removeGroupMember = async (userId) => {
    if (!selectedGroup) return;

    try {
      const response = await api.delete(`/groups/${selectedGroup._id}/members/${userId}`);
      setSelectedGroup(response.data.group);
      setGroups((currentGroups) =>
        currentGroups.map((group) =>
          group._id === response.data.group._id ? response.data.group : group
        )
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Member could not be removed.");
    }
  };

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <header className="brand-header">
          <div className="brand-logo">RC</div>
          <div className="brand-details">
            <h1>RBTChat</h1>
            <p>{currentUser.name}</p>
          </div>
        </header>

        <div className="sidebar-title">
          <h2>Chats</h2>
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowCreateGroup((open) => !open)}
          >
            +
          </button>
        </div>

        {showCreateGroup && (
          <div className="group-creator">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
            />
            <select
              value={groupMemberIds[0] || ""}
              onChange={(event) => setGroupMemberIds([event.target.value])}
            >
              <option value="">Add a member</option>
              {users.map((user) => (
                <option value={user._id} key={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={createGroup}>
              Create group
            </button>
          </div>
        )}

        <div className="search-container">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="conversation-list">
          <div className="conversation-mode-switch">
            <button
              type="button"
              className={conversationMode === "direct" ? "active" : ""}
              onClick={() => {
                setConversationMode("direct");
                setSelectedGroup(null);
              }}
            >
              Direct
            </button>
            <button
              type="button"
              className={conversationMode === "group" ? "active" : ""}
              onClick={() => setConversationMode("group")}
            >
              Groups
            </button>
          </div>

          {conversationMode === "direct" ? (
            <>
              {users.length === 0 && !error && (
                <div className="empty-users">
                  <p>No other users found</p>
                  <span>Create another account to begin chatting.</span>
                </div>
              )}

              {filteredUsers.map((user) => {
                const lastMessage = getLastMessage(user._id);
                const isSelected = selectedUser?._id === user._id;

                return (
                  <button
                    type="button"
                    className={`conversation-card ${isSelected ? "selected" : ""}`}
                    key={user._id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSelectedGroup(null);
                      setConversationMode("direct");
                    }}
                  >
                    <div className="avatar">
                      {getInitials(user.name)}
                      {onlineUserIds.includes(user._id) && (
                        <span className="online-dot" />
                      )}
                    </div>
                    <div className="conversation-details">
                      <div className="conversation-heading">
                        <h3>{user.name}</h3>
                        <time>
                          {lastMessage ? formatTime(lastMessage.createdAt) : ""}
                        </time>
                      </div>
                      <p>
                        {getMessagePreview(lastMessage) ||
                          `Start chatting with ${user.name}`}
                      </p>
                    </div>
                  </button>
                );
              })}

              <div className="sidebar-ai-card-bottom">
                <button
                  type="button"
                  className="sidebar-ai-button"
                  onClick={requestAiSuggestions}
                  disabled={!selectedUser || isLoadingAi}
                >
                  {isLoadingAi ? "Generating..." : "RBT-AI"}
                </button>
                {aiError && <p className="sidebar-ai-error">{aiError}</p>}
                {aiSuggestions.length > 0 && (
                  <div className="sidebar-ai-suggestions">
                    <h4>RBT-AI Suggestions</h4>
                    {aiAnalysis && (
                      <>
                        <div className={`ai-sentiment-badge ai-sentiment-${aiAnalysis.detectedSentiment}`}>
                          📊 {aiAnalysis.detectedSentiment.toUpperCase()}
                        </div>
                        <div className="ai-flow-info">
                          <strong>Chat Analysis:</strong>
                          <br />
                          Messages: {aiAnalysis.conversationLength}
                          <br />
                          Tone: {aiAnalysis.detectedSentiment}
                        </div>
                      </>
                    )}
                    <ul>
                      {aiSuggestions.map((suggestion, index) => (
                        <li key={index}>
                          <button
                            type="button"
                            className="sidebar-ai-suggestion"
                            onClick={() => setMessage(suggestion)}
                          >
                            {suggestion}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {predictedReplies.length > 0 && (
                  <div className="sidebar-ai-suggestions predictive-panel">
                    <h4>🔮 Predicted Replies</h4>
                    {contextualInsight && (
                      <div className="ai-flow-info">
                        <strong>Your Style:</strong>
                        <br />
                        Tone: {contextualInsight.communicationStyle}
                        <br />
                        Recent: {contextualInsight.recentMessageCount} messages
                      </div>
                    )}
                    <ul>
                      {predictedReplies.map((reply, index) => (
                        <li key={`predicted-${index}`}>
                          <button
                            type="button"
                            className="sidebar-ai-suggestion predictive-suggestion"
                            onClick={() => setMessage(reply)}
                            title="AI predicted you might want to say this"
                          >
                            💡 {reply}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {filteredGroups.length === 0 && !error && (
                <div className="empty-users">
                  <p>No groups yet</p>
                  <span>Create a group to chat with multiple people.</span>
                </div>
              )}

              {filteredGroups.map((group) => {
                const isSelected = selectedGroup?._id === group._id;

                return (
                  <button
                    type="button"
                    className={`conversation-card ${isSelected ? "selected" : ""}`}
                    key={group._id}
                    onClick={() => {
                      setSelectedGroup(group);
                      setSelectedUser(null);
                      setConversationMode("group");
                    }}
                  >
                    <div className="avatar">{getInitials(group.name)}</div>
                    <div className="conversation-details">
                      <div className="conversation-heading">
                        <h3>{group.name}</h3>
                      </div>
                      <p>{group.members?.length || 0} members</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </aside>

      <main className="chat-area">
        {conversationMode === "group" ? (
          selectedGroup ? (
            <>
              <header className="chat-header">
                <div className="avatar small-avatar">{getInitials(selectedGroup.name)}</div>
                <div className="selected-user-details">
                  <h2>{selectedGroup.name}</h2>
                  <p>{selectedGroup.members?.length || 0} members</p>
                </div>

                <div className="call-header-actions">
                  <button
                    type="button"
                    className="call-action-button"
                    onClick={() => setShowGroupAdminPanel((open) => !open)}
                  >
                    Admin
                  </button>
                </div>
              </header>

              {showGroupAdminPanel && (
                <div className="group-admin-panel">
                  <input
                    type="text"
                    placeholder="Add member by user ID"
                    value={newMemberId}
                    onChange={(event) => setNewMemberId(event.target.value)}
                  />
                  <button type="button" onClick={addGroupMember}>
                    Add member
                  </button>
                  <div className="group-member-list">
                    {(selectedGroup.members || []).map((member) => (
                      <div className="group-member-item" key={member._id || member}>
                        <span>{member.name || member}</span>
                        <button type="button" onClick={() => removeGroupMember(member._id || member)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <section className="messages">
                <div className="encryption-notice">Group messages are synced for everyone in the group.</div>
                {error && <p className="chat-request-error">{error}</p>}
                {isLoadingMessages ? (
                  <div className="chat-loading">Loading group conversation...</div>
                ) : messages.length === 0 ? (
                  <div className="empty-chat">
                    <div className="empty-chat-logo">RC</div>
                    <h2>Start the group chat</h2>
                    <p>Send a message to {selectedGroup.name}.</p>
                  </div>
                ) : (
                  messages.map((chatMessage) => {
                    const senderId = chatMessage.sender?._id || chatMessage.sender;
                    const isMine = String(senderId) === currentUser.id;
                    const isDeleted = isDeletedForCurrentUser(chatMessage);

                    return (
                      <div className={`message-row ${isMine ? "mine" : "theirs"}`} key={chatMessage._id}>
                        <div className="message-bubble">
                          {isDeleted ? (
                            <p className="deleted-message">This message was deleted</p>
                          ) : (
                            <p>{chatMessage.text}</p>
                          )}
                          <div className="message-meta">
                            <div className="message-time">
                              {formatTime(chatMessage.createdAt)}
                              {isMine && <span>{chatMessage.read ? "✓✓" : "✓"}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </section>

              <footer className="message-input">
                <input
                  type="text"
                  placeholder={`Message ${selectedGroup.name}`}
                  value={message}
                  maxLength={2000}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      const text = message.trim();
                      if (text) {
                        api.post(`/groups/${selectedGroup._id}/messages`, { text }).then((response) => {
                          setMessages((currentMessages) => [...currentMessages, response.data.message]);
                          setMessage("");
                        }).catch(() => setError("Group message could not be sent."));
                      }
                    }
                  }}
                />
                <button
                  className="send-button"
                  type="button"
                  onClick={() => {
                    const text = message.trim();
                    if (!text) return;
                    api.post(`/groups/${selectedGroup._id}/messages`, { text }).then((response) => {
                      setMessages((currentMessages) => [...currentMessages, response.data.message]);
                      setMessage("");
                    }).catch(() => setError("Group message could not be sent."));
                  }}
                >
                  ➤
                </button>
              </footer>
            </>
          ) : (
            <div className="welcome-screen">
              <div className="welcome-logo">RC</div>
              <h1>RBTChat</h1>
              <p>Select a group to begin chatting.</p>
            </div>
          )
        ) : selectedUser ? (
          <>
            <header className="chat-header">
              <div className="avatar small-avatar">
                {getInitials(selectedUser.name)}
                {onlineUserIds.includes(selectedUser._id) && (
                  <span className="online-dot" />
                )}
              </div>
              <div className="selected-user-details">
                <h2>{selectedUser.name}</h2>
                <p>
                  {onlineUserIds.includes(selectedUser._id)
                    ? "Online"
                    : "Offline"}
                </p>
              </div>

              <div className="call-header-actions">
                <button
                  type="button"
                  className="call-action-button"
                  onClick={() => call.startCall(selectedUser, "voice")}
                  disabled={
                    !onlineUserIds.includes(selectedUser._id) || call.isActive
                  }
                >
                  Voice
                </button>
                <button
                  type="button"
                  className="call-action-button video"
                  onClick={() => call.startCall(selectedUser, "video")}
                  disabled={
                    !onlineUserIds.includes(selectedUser._id) || call.isActive
                  }
                >
                  Video
                </button>
              </div>
            </header>

            <section className="messages">
              <div className="encryption-notice">
                Messages are stored securely in RBTChat
              </div>

              {error && <p className="chat-request-error">{error}</p>}

              {isLoadingMessages ? (
                <div className="chat-loading">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-chat-logo">RC</div>
                  <h2>Start a conversation</h2>
                  <p>Send your first message to {selectedUser.name}.</p>
                </div>
              ) : (
                messages.map((chatMessage) => {
                  const senderId =
                    chatMessage.sender?._id || chatMessage.sender;
                  const isMine = String(senderId) === currentUser.id;
                  const isDeleted = isDeletedForCurrentUser(chatMessage);

                  return (
                    <div
                      className={`message-row ${isMine ? "mine" : "theirs"}`}
                      key={chatMessage._id}
                    >
                      <div className="message-bubble">
                        {isDeleted ? (
                          <p className="deleted-message">This message was deleted</p>
                        ) : chatMessage.type === "voice" ? (
                          <audio
                            className="voice-message"
                            controls
                            preload="metadata"
                            src={getMediaUrl(chatMessage.mediaUrl)}
                          />
                        ) : chatMessage.type === "video" ? (
                          <video
                            className="video-message"
                            controls
                            preload="metadata"
                            src={getMediaUrl(chatMessage.mediaUrl)}
                          />
                        ) : chatMessage.type === "image" ? (
                          <img
                            className="image-message"
                            src={getMediaUrl(chatMessage.mediaUrl)}
                            alt={chatMessage.fileName || "Shared photo"}
                          />
                        ) : chatMessage.type === "document" ? (
                          <a
                            className="document-message"
                            href={getMediaUrl(chatMessage.mediaUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {chatMessage.fileName || "Open document"}
                          </a>
                        ) : chatMessage.type === "location" ? (
                          <div className="location-message">
                            <p>{chatMessage.text}</p>
                            {(() => {
                              const match = chatMessage.text?.match(
                                /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/
                              );
                              if (match) {
                                return (
                                  <a
                                    href={`https://www.google.com/maps?q=${match[1]},${match[2]}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open in map
                                  </a>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <p>{chatMessage.text}</p>
                        )}
                        <div className="message-meta">
                          <div className="message-time">
                            {formatTime(chatMessage.createdAt)}
                            {isMine && <span>{chatMessage.read ? "✓✓" : "✓"}</span>}
                          </div>
                          {!isDeleted && (
                            <div className="message-actions">
                              <button
                                type="button"
                                className="message-action-button"
                                onClick={() =>
                                  setActiveDeleteMenuId((currentId) =>
                                    currentId === chatMessage._id ? null : chatMessage._id
                                  )
                                }
                              >
                                ⋯
                              </button>
                              {activeDeleteMenuId === chatMessage._id && (
                                <div className="delete-menu">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(chatMessage, "me")}
                                  >
                                    Delete for me
                                  </button>
                                  {isMine && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(chatMessage, "all")}
                                    >
                                      Delete for everyone
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </section>

            <footer className="message-input">
              <div className="attach-wrapper">
                <button
                  className="input-icon"
                  title="Attach"
                  onClick={() => setShowAttachMenu((open) => !open)}
                  type="button"
                >
                  +
                </button>
                <div className={`attach-menu ${showAttachMenu ? "open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    Video
                  </button>
                  <button
                    type="button"
                    onClick={() => documentInputRef.current?.click()}
                  >
                    Document
                  </button>
                  <button type="button" onClick={handleShareLocation}>
                    Location
                  </button>
                  <button type="button" onClick={startVoiceRecording}>
                    Record voice message
                  </button>
                </div>
              </div>

              <input
                ref={photoInputRef}
                className="hidden-media-input"
                type="file"
                accept="image/*"
                onChange={(event) => handleFileSelected(event, "image")}
              />

              <input
                ref={videoInputRef}
                className="hidden-media-input"
                type="file"
                accept="video/*"
                onChange={(event) => handleFileSelected(event, "video")}
              />

              <input
                ref={documentInputRef}
                className="hidden-media-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.json,.xml"
                onChange={(event) => handleFileSelected(event, "document")}
              />

              <input
                type="text"
                placeholder={
                  isRecording
                    ? `Recording ${formatRecordingTime(recordingSeconds)}`
                    : `Message ${selectedUser.name}`
                }
                value={message}
                maxLength={2000}
                disabled={isRecording || isUploading}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) handleSend();
                }}
              />

              <button
                className={`voice-record-button ${
                  isRecording ? "recording" : ""
                }`}
                type="button"
                onClick={
                  isRecording ? stopVoiceRecording : startVoiceRecording
                }
                disabled={isUploading}
              >
                {isRecording
                  ? `Stop ${formatRecordingTime(recordingSeconds)}`
                  : "Voice"}
              </button>

              <button
                className="send-button"
                type="button"
                onClick={handleSend}
                disabled={
                  !message.trim() ||
                  isSending ||
                  isUploading ||
                  isRecording
                }
                aria-label="Send message"
              >
                ➤
              </button>
              {isUploading && (
                <span className="media-uploading">Uploading...</span>
              )}
            </footer>
          </>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-logo">RC</div>
            <h1>RBTChat</h1>
            <p>Select a person to begin chatting.</p>
          </div>
        )}
      </main>

      <CallOverlay call={call} getInitials={getInitials} />
    </div>
  );
}

export default Chat;
