import { useEffect, useState } from "react";
import { getSettingsPageForSection } from "./settingsSections";
import "./Settings.css";

const SETTINGS_STORAGE_KEY = "rbtchatPreferences";

const DEFAULT_PREFERENCES = {
  profile: {
    about: "Building thoughtful customer conversations.",
    status: "Available",
  },
  general: {
    startAtLogin: false,
    minimizeToTray: true,
    language: "British English",
    fontSize: "90%",
  },
  account: {
    securityNotifications: true,
    loginAlerts: true,
    emailRecovery: true,
  },
  privacy: {
    lastSeen: "Nobody, Everyone",
    profilePicture: "Everyone",
    aboutVisibility: "Everyone",
    statusVisibility: "462 contacts excluded",
    readReceipts: true,
    defaultMessageTimer: "Off",
    groups: "Everyone",
    blockedContacts: "22",
    appLock: false,
  },
  chats: {
    wallpaper: "Aurora dusk",
    mediaUploadQuality: "HD",
    mediaAutoDownload: "Wi-Fi and cellular",
    spellCheck: true,
    emojiReplacement: true,
    enterIsSend: true,
  },
  ai: {
    assistantMode: "Balanced",
    smartReplies: true,
    summaries: true,
    translationHelp: true,
    toneGuide: "Professional",
    workspaceMemory: "Pinned chats only",
  },
  notifications: {
    showBanner: "Always",
    taskbarBadge: "Always",
    messages: true,
    groups: true,
    status: true,
    calls: true,
    showPreviews: true,
    outgoingSounds: false,
  },
  appearance: {
    density: "Comfortable",
    accentStyle: "Electric indigo",
    animations: true,
  },
  video: {
    camera: "Default camera",
    microphone: "Default microphone",
    speakers: "Default speakers",
  },
};

function mergePreferences(storedPreferences = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_PREFERENCES).map(([sectionName, sectionDefaults]) => [
      sectionName,
      {
        ...sectionDefaults,
        ...(storedPreferences[sectionName] || {}),
      },
    ])
  );
}

function loadPreferences() {
  if (typeof window === "undefined") {
    return mergePreferences();
  }

  try {
    const storedValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return mergePreferences(storedValue ? JSON.parse(storedValue) : {});
  } catch {
    return mergePreferences();
  }
}

function buildInitialProfileForm(currentUser, profilePreferences) {
  return {
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    about: profilePreferences.about || "",
    status: profilePreferences.status || "",
  };
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ToggleButton({ checked, onClick, label }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? "on" : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

function SectionHeader({ title, description, onBack }) {
  return (
    <div className="settings-view-header">
      <button
        type="button"
        className="settings-back-button"
        onClick={onBack}
        aria-label="Go back"
      >
        <BackIcon />
      </button>

      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onToggle }) {
  return (
    <div className="settings-row">
      <div className="settings-row-copy">
        <strong>{label}</strong>
        {description ? <p>{description}</p> : null}
      </div>

      <ToggleButton checked={checked} onClick={onToggle} label={label} />
    </div>
  );
}

function SelectRow({ label, description, value, options, onChange }) {
  return (
    <div className="settings-row">
      <div className="settings-row-copy">
        <strong>{label}</strong>
        {description ? <p>{description}</p> : null}
      </div>

      <label className="settings-select-wrap">
        <span className="settings-sr-only">{label}</span>
        <select
          className="settings-select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ActionRow({ label, description, value, onClick }) {
  return (
    <button type="button" className="settings-nav-row" onClick={onClick}>
      <div className="settings-row-copy">
        <strong>{label}</strong>
        {description ? <p>{description}</p> : null}
      </div>

      <div className="settings-row-end">
        {value ? <span className="settings-row-value">{value}</span> : null}
        <ChevronRightIcon />
      </div>
    </button>
  );
}

function ShortcutCard({ badge, title, detail, onClick }) {
  return (
    <button type="button" className="settings-shortcut-card" onClick={onClick}>
      <span className="settings-shortcut-badge">{badge}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </button>
  );
}

function Settings({
  currentUser,
  section,
  returnPage,
  theme,
  onThemeChange,
  onNavigate,
  onLogout,
  onProfileSave,
}) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [notice, setNotice] = useState("");
  const [profileForm, setProfileForm] = useState(() =>
    buildInitialProfileForm(currentUser, loadPreferences().profile)
  );

  useEffect(() => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  }, [preferences]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice("");
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice]);

  useEffect(() => {
    if (section !== "profile") {
      return;
    }

    setProfileForm(buildInitialProfileForm(currentUser, preferences.profile));
  }, [currentUser, preferences.profile, section]);

  const initials = currentUser.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const updateSection = (sectionName, updater) => {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [sectionName]:
        typeof updater === "function"
          ? updater(currentPreferences[sectionName])
          : {
              ...currentPreferences[sectionName],
              ...updater,
            },
    }));
  };

  const navigateToSection = (nextSection) => {
    onNavigate(getSettingsPageForSection(nextSection));
  };

  const goBack = () => {
    onNavigate(section === "general" ? returnPage || "dashboard" : "settings");
  };

  const handleProfileSave = () => {
    const trimmedName = profileForm.name.trim() || currentUser.name;
    const trimmedEmail = profileForm.email.trim() || currentUser.email;
    const trimmedAbout = profileForm.about.trim();
    const trimmedStatus = profileForm.status.trim();

    onProfileSave?.({
      name: trimmedName,
      email: trimmedEmail,
    });

    updateSection("profile", {
      about: trimmedAbout,
      status: trimmedStatus,
    });

    setNotice("Profile changes saved.");
  };

  const handleLogoutClick = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?\n\nAny unsaved changes may be lost."
    );

    if (confirmLogout) {
      onLogout?.();
    }
  };

  const copyDiagnostics = async () => {
    const diagnostics = {
      theme,
      section,
      preferences,
      generatedAt: "2026-07-22",
    };

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(diagnostics, null, 2)
      );
      setNotice("Diagnostics copied to clipboard.");
    } catch {
      setNotice("Could not copy diagnostics. Clipboard access was denied.");
    }
  };

  const sectionMeta = {
    general: {
      title: "General",
      description:
        "Desktop-style preferences, shortcuts, and WhatsApp-inspired workspace controls.",
    },
    profile: {
      title: "Profile",
      description:
        "Update your public identity, contact email, and the message people see first.",
    },
    account: {
      title: "Account",
      description:
        "Security notices, account exports, and key ownership controls.",
    },
    privacy: {
      title: "Privacy",
      description:
        "Choose who can see your activity, status, and profile details.",
    },
    chats: {
      title: "Chats",
      description:
        "Control themes, message composition, media handling, and wallpaper choices.",
    },
    ai: {
      title: "AI Settings",
      description:
        "Tune smart replies, summaries, translation help, and assistant behavior.",
    },
    notifications: {
      title: "Notifications",
      description:
        "Decide how message, group, status, and call alerts should behave.",
    },
    help: {
      title: "Help & Feedback",
      description:
        "Reach support, export diagnostics, and capture product feedback quickly.",
    },
    appearance: {
      title: "Appearance",
      description:
        "Switch themes and refine how dense, animated, and vivid the interface feels.",
    },
    video: {
      title: "Video & voice",
      description:
        "Pick the camera, microphone, and speakers used during calls.",
    },
  };

  const renderGeneral = () => (
    <div className="settings-split-grid">
      <section className="settings-card settings-card-large">
        <div className="settings-alert">
          <span className="settings-alert-badge">WIN</span>
          <div>
            <strong>Windows settings</strong>
            <p>
              Startup and desktop notification hooks are modelled after WhatsApp
              Desktop and ready for OS integration.
            </p>
          </div>
        </div>

        <div className="settings-group">
          <h3>Startup and close</h3>
          <ToggleRow
            label="Start RBTChat at login"
            description="Launch the workspace as soon as Windows finishes signing in."
            checked={preferences.general.startAtLogin}
            onToggle={() =>
              updateSection("general", (currentSection) => ({
                ...currentSection,
                startAtLogin: !currentSection.startAtLogin,
              }))
            }
          />
          <ToggleRow
            label="Minimise to system tray"
            description="Keep the workspace active after closing the main window."
            checked={preferences.general.minimizeToTray}
            onToggle={() =>
              updateSection("general", (currentSection) => ({
                ...currentSection,
                minimizeToTray: !currentSection.minimizeToTray,
              }))
            }
          />
        </div>

        <div className="settings-group">
          <h3>Display</h3>
          <SelectRow
            label="Language"
            description="Choose the language used across settings and chat tools."
            value={preferences.general.language}
            options={[
              "British English",
              "American English",
              "Hindi",
              "Spanish",
            ]}
            onChange={(nextValue) =>
              updateSection("general", { language: nextValue })
            }
          />
          <SelectRow
            label="Font size"
            description="Scale message and settings text to match your desktop setup."
            value={preferences.general.fontSize}
            options={["90%", "100%", "110%", "125%"]}
            onChange={(nextValue) =>
              updateSection("general", { fontSize: nextValue })
            }
          />
        </div>

        <div className="settings-group">
          <h3>Workspace status</h3>
          <ActionRow
            label="Open profile"
            description="Review the public name, email, and bio shown in the menu."
            value={currentUser.name}
            onClick={() => navigateToSection("profile")}
          />
          <ActionRow
            label="Appearance"
            description="Choose light or dark mode and refine the visual density."
            value={theme === "light" ? "Light mode" : "Dark mode"}
            onClick={() => navigateToSection("appearance")}
          />
        </div>
      </section>

      <aside className="settings-card">
        <h3>Quick access</h3>
        <div className="settings-shortcuts">
          <ShortcutCard
            badge="VV"
            title="Video & voice"
            detail="Camera, microphone, and speakers"
            onClick={() => navigateToSection("video")}
          />
          <ShortcutCard
            badge="AC"
            title="Account"
            detail="Security notices and exports"
            onClick={() => navigateToSection("account")}
          />
          <ShortcutCard
            badge="PR"
            title="Privacy"
            detail="Visibility and app lock"
            onClick={() => navigateToSection("privacy")}
          />
          <ShortcutCard
            badge="CH"
            title="Chats"
            detail="Theme, wallpaper, and typing"
            onClick={() => navigateToSection("chats")}
          />
          <ShortcutCard
            badge="AI"
            title="AI Settings"
            detail="Replies, summaries, and tone"
            onClick={() => navigateToSection("ai")}
          />
          <ShortcutCard
            badge="NT"
            title="Notifications"
            detail="Banners, badges, and sounds"
            onClick={() => navigateToSection("notifications")}
          />
          <ShortcutCard
            badge="HB"
            title="Help & Feedback"
            detail="Support, diagnostics, and ideas"
            onClick={() => navigateToSection("help")}
          />
          <ShortcutCard
            badge="TH"
            title="Theme"
            detail="Light or dark mode"
            onClick={() => navigateToSection("appearance")}
          />
        </div>

        <div className="settings-mini-card">
          <strong>Current setup</strong>
          <p>{theme === "light" ? "Light mode" : "Dark mode"} active</p>
          <p>{preferences.general.language}</p>
          <p>{preferences.general.fontSize} text scale</p>
        </div>

        <button
          type="button"
          className="settings-danger-button"
          onClick={handleLogoutClick}
        >
          Logout
        </button>
      </aside>
    </div>
  );

  const renderProfile = () => (
    <section className="settings-card settings-card-large">
      <div className="settings-profile-hero">
        <div className="settings-profile-avatar">{initials}</div>
        <div className="settings-profile-copy">
          <strong>{currentUser.name}</strong>
          <span>{currentUser.email}</span>
        </div>
      </div>

      <div className="settings-form-grid">
        <label className="settings-field">
          <span>Name</span>
          <input
            type="text"
            value={profileForm.name}
            onChange={(event) =>
              setProfileForm((currentForm) => ({
                ...currentForm,
                name: event.target.value,
              }))
            }
          />
        </label>

        <label className="settings-field">
          <span>Email</span>
          <input
            type="email"
            value={profileForm.email}
            onChange={(event) =>
              setProfileForm((currentForm) => ({
                ...currentForm,
                email: event.target.value,
              }))
            }
          />
        </label>

        <label className="settings-field settings-field-wide">
          <span>Status</span>
          <input
            type="text"
            value={profileForm.status}
            onChange={(event) =>
              setProfileForm((currentForm) => ({
                ...currentForm,
                status: event.target.value,
              }))
            }
          />
        </label>

        <label className="settings-field settings-field-wide">
          <span>About</span>
          <textarea
            rows="5"
            value={profileForm.about}
            onChange={(event) =>
              setProfileForm((currentForm) => ({
                ...currentForm,
                about: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="settings-actions">
        <button
          type="button"
          className="settings-secondary-button"
          onClick={() =>
            setProfileForm(buildInitialProfileForm(currentUser, preferences.profile))
          }
        >
          Reset
        </button>
        <button
          type="button"
          className="settings-primary-button"
          onClick={handleProfileSave}
        >
          Save changes
        </button>
      </div>
    </section>
  );

  const renderAccount = () => (
    <div className="settings-stack">
      <section className="settings-card">
        <div className="settings-list">
          <ActionRow
            label="Security notifications"
            description="Get warned when a login, device, or encryption change looks unusual."
            value={preferences.account.securityNotifications ? "On" : "Off"}
            onClick={() =>
              updateSection("account", (currentSection) => ({
                ...currentSection,
                securityNotifications: !currentSection.securityNotifications,
              }))
            }
          />
          <ActionRow
            label="Request account info"
            description="Prepare an export of identity and usage records."
            onClick={() =>
              setNotice("Account export request queued for preparation.")
            }
          />
          <ActionRow
            label="How to delete my account"
            description="Review the removal steps before taking permanent action."
            onClick={() =>
              setNotice("Account deletion help opened. No destructive action was taken.")
            }
          />
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-group compact">
          <h3>Recovery</h3>
          <ToggleRow
            label="Login alerts"
            description="Email a heads-up when a new device connects."
            checked={preferences.account.loginAlerts}
            onToggle={() =>
              updateSection("account", (currentSection) => ({
                ...currentSection,
                loginAlerts: !currentSection.loginAlerts,
              }))
            }
          />
          <ToggleRow
            label="Email recovery"
            description="Allow email-based recovery for locked sessions."
            checked={preferences.account.emailRecovery}
            onToggle={() =>
              updateSection("account", (currentSection) => ({
                ...currentSection,
                emailRecovery: !currentSection.emailRecovery,
              }))
            }
          />
        </div>
      </section>
    </div>
  );

  const renderPrivacy = () => (
    <section className="settings-card settings-card-large">
      <div className="settings-group compact">
        <h3>Who can see my personal info</h3>
        <SelectRow
          label="Last seen and online"
          description="Choose who can see your recent activity and presence."
          value={preferences.privacy.lastSeen}
          options={[
            "Everyone, Everyone",
            "My contacts, My contacts",
            "Nobody, Everyone",
          ]}
          onChange={(nextValue) =>
            updateSection("privacy", { lastSeen: nextValue })
          }
        />
        <SelectRow
          label="Profile picture"
          description="Control who can see the avatar used in chats and menus."
          value={preferences.privacy.profilePicture}
          options={["Everyone", "My contacts", "Nobody"]}
          onChange={(nextValue) =>
            updateSection("privacy", { profilePicture: nextValue })
          }
        />
        <SelectRow
          label="About"
          description="Choose who can see your profile bio."
          value={preferences.privacy.aboutVisibility}
          options={["Everyone", "My contacts", "Nobody"]}
          onChange={(nextValue) =>
            updateSection("privacy", { aboutVisibility: nextValue })
          }
        />
        <SelectRow
          label="Status"
          description="Decide who is included in story-style status updates."
          value={preferences.privacy.statusVisibility}
          options={[
            "Everyone",
            "My contacts",
            "462 contacts excluded",
            "Only share with selected contacts",
          ]}
          onChange={(nextValue) =>
            updateSection("privacy", { statusVisibility: nextValue })
          }
        />
        <ToggleRow
          label="Read receipts"
          description="If turned off, you will not send or receive read receipts."
          checked={preferences.privacy.readReceipts}
          onToggle={() =>
            updateSection("privacy", (currentSection) => ({
              ...currentSection,
              readReceipts: !currentSection.readReceipts,
            }))
          }
        />
        <SelectRow
          label="Default message timer"
          description="Set disappearing messages for new conversations."
          value={preferences.privacy.defaultMessageTimer}
          options={["Off", "24 hours", "7 days", "90 days"]}
          onChange={(nextValue) =>
            updateSection("privacy", { defaultMessageTimer: nextValue })
          }
        />
        <SelectRow
          label="Groups"
          description="Choose who can add you to new group chats."
          value={preferences.privacy.groups}
          options={["Everyone", "My contacts", "My contacts except..."]}
          onChange={(nextValue) => updateSection("privacy", { groups: nextValue })}
        />
        <ActionRow
          label="Blocked contacts"
          description="Review the list of accounts currently blocked."
          value={preferences.privacy.blockedContacts}
          onClick={() => setNotice("Blocked contact review opened.")}
        />
        <ToggleRow
          label="App lock"
          description="Require a password before the workspace can be reopened."
          checked={preferences.privacy.appLock}
          onToggle={() =>
            updateSection("privacy", (currentSection) => ({
              ...currentSection,
              appLock: !currentSection.appLock,
            }))
          }
        />
      </div>
    </section>
  );

  const renderChats = () => (
    <section className="settings-card settings-card-large">
      <div className="settings-group compact">
        <h3>Display</h3>
        <ActionRow
          label="Theme"
          description="Switch between light and dark modes."
          value={theme === "light" ? "Light mode" : "Dark mode"}
          onClick={() => navigateToSection("appearance")}
        />
        <SelectRow
          label="Wallpaper"
          description="Set the default background used in your conversations."
          value={preferences.chats.wallpaper}
          options={["Aurora dusk", "Muted slate", "Forest mist", "Warm sunrise"]}
          onChange={(nextValue) =>
            updateSection("chats", { wallpaper: nextValue })
          }
        />
      </div>

      <div className="settings-group compact">
        <h3>Chat settings</h3>
        <SelectRow
          label="Media upload quality"
          description="Choose how aggressively media should be compressed."
          value={preferences.chats.mediaUploadQuality}
          options={["Standard", "HD", "Original"]}
          onChange={(nextValue) =>
            updateSection("chats", { mediaUploadQuality: nextValue })
          }
        />
        <SelectRow
          label="Media auto-download"
          description="Choose when incoming media should be fetched automatically."
          value={preferences.chats.mediaAutoDownload}
          options={[
            "Wi-Fi only",
            "Wi-Fi and cellular",
            "Never auto-download",
          ]}
          onChange={(nextValue) =>
            updateSection("chats", { mediaAutoDownload: nextValue })
          }
        />
        <ToggleRow
          label="Spell check"
          description="Check spelling while you type."
          checked={preferences.chats.spellCheck}
          onToggle={() =>
            updateSection("chats", (currentSection) => ({
              ...currentSection,
              spellCheck: !currentSection.spellCheck,
            }))
          }
        />
        <ToggleRow
          label="Replace text with emoji"
          description="Transform common emoticons into emoji as you type."
          checked={preferences.chats.emojiReplacement}
          onToggle={() =>
            updateSection("chats", (currentSection) => ({
              ...currentSection,
              emojiReplacement: !currentSection.emojiReplacement,
            }))
          }
        />
        <ToggleRow
          label="Enter is send"
          description="Use the Enter key to send your message immediately."
          checked={preferences.chats.enterIsSend}
          onToggle={() =>
            updateSection("chats", (currentSection) => ({
              ...currentSection,
              enterIsSend: !currentSection.enterIsSend,
            }))
          }
        />
      </div>
    </section>
  );

  const renderAi = () => (
    <section className="settings-card settings-card-large">
      <div className="settings-group compact">
        <h3>Assistant behavior</h3>
        <SelectRow
          label="Assistant mode"
          description="Choose the balance between speed, creativity, and caution."
          value={preferences.ai.assistantMode}
          options={["Balanced", "Fast", "Precise"]}
          onChange={(nextValue) =>
            updateSection("ai", { assistantMode: nextValue })
          }
        />
        <SelectRow
          label="Tone guide"
          description="Shape the default wording used by AI-generated suggestions."
          value={preferences.ai.toneGuide}
          options={["Professional", "Warm", "Concise", "Supportive"]}
          onChange={(nextValue) => updateSection("ai", { toneGuide: nextValue })}
        />
        <ToggleRow
          label="Smart replies"
          description="Offer quick response suggestions directly in the composer."
          checked={preferences.ai.smartReplies}
          onToggle={() =>
            updateSection("ai", (currentSection) => ({
              ...currentSection,
              smartReplies: !currentSection.smartReplies,
            }))
          }
        />
        <ToggleRow
          label="Conversation summaries"
          description="Generate concise catch-up notes for long threads."
          checked={preferences.ai.summaries}
          onToggle={() =>
            updateSection("ai", (currentSection) => ({
              ...currentSection,
              summaries: !currentSection.summaries,
            }))
          }
        />
        <ToggleRow
          label="Translation help"
          description="Suggest translations for multilingual customer messages."
          checked={preferences.ai.translationHelp}
          onToggle={() =>
            updateSection("ai", (currentSection) => ({
              ...currentSection,
              translationHelp: !currentSection.translationHelp,
            }))
          }
        />
        <SelectRow
          label="Workspace memory"
          description="Limit how much recent context the assistant should use."
          value={preferences.ai.workspaceMemory}
          options={[
            "Pinned chats only",
            "Recent active chats",
            "Workspace default",
          ]}
          onChange={(nextValue) =>
            updateSection("ai", { workspaceMemory: nextValue })
          }
        />
      </div>
    </section>
  );

  const renderNotifications = () => (
    <section className="settings-card settings-card-large">
      <div className="settings-alert subtle">
        <span className="settings-alert-badge">OS</span>
        <div>
          <strong>Notification sync</strong>
          <p>
            Banner and badge settings are ready in-app and can later be paired
            with system-level desktop permissions.
          </p>
        </div>
      </div>

      <div className="settings-group compact">
        <SelectRow
          label="Show notification banner"
          description="Choose when desktop banners should appear."
          value={preferences.notifications.showBanner}
          options={["Always", "When away", "Never"]}
          onChange={(nextValue) =>
            updateSection("notifications", { showBanner: nextValue })
          }
        />
        <SelectRow
          label="Show taskbar notification badge"
          description="Control whether unread counts appear on the taskbar icon."
          value={preferences.notifications.taskbarBadge}
          options={["Always", "Unread only", "Never"]}
          onChange={(nextValue) =>
            updateSection("notifications", { taskbarBadge: nextValue })
          }
        />
        <ToggleRow
          label="Messages"
          description="Receive alerts for direct conversations."
          checked={preferences.notifications.messages}
          onToggle={() =>
            updateSection("notifications", (currentSection) => ({
              ...currentSection,
              messages: !currentSection.messages,
            }))
          }
        />
        <ToggleRow
          label="Groups"
          description="Receive alerts for shared team and customer groups."
          checked={preferences.notifications.groups}
          onToggle={() =>
            updateSection("notifications", (currentSection) => ({
              ...currentSection,
              groups: !currentSection.groups,
            }))
          }
        />
        <ToggleRow
          label="Status"
          description="Receive alerts when important status updates are posted."
          checked={preferences.notifications.status}
          onToggle={() =>
            updateSection("notifications", (currentSection) => ({
              ...currentSection,
              status: !currentSection.status,
            }))
          }
        />
        <ToggleRow
          label="Calls"
          description="Receive alerts for incoming voice and video calls."
          checked={preferences.notifications.calls}
          onToggle={() =>
            updateSection("notifications", (currentSection) => ({
              ...currentSection,
              calls: !currentSection.calls,
            }))
          }
        />
        <ToggleRow
          label="Show previews"
          description="Display message snippets inside notifications."
          checked={preferences.notifications.showPreviews}
          onToggle={() =>
            updateSection("notifications", (currentSection) => ({
              ...currentSection,
              showPreviews: !currentSection.showPreviews,
            }))
          }
        />
        <ToggleRow
          label="Play sound for outgoing messages"
          description="Play a short confirmation sound after sending."
          checked={preferences.notifications.outgoingSounds}
          onToggle={() =>
            updateSection("notifications", (currentSection) => ({
              ...currentSection,
              outgoingSounds: !currentSection.outgoingSounds,
            }))
          }
        />
      </div>
    </section>
  );

  const renderHelp = () => (
    <div className="settings-stack">
      <section className="settings-card">
        <div className="settings-list">
          <ActionRow
            label="Report a problem"
            description="Capture the current page and send a bug report to the product team."
            onClick={() =>
              setNotice("Feedback draft started. Please attach the issue details next.")
            }
          />
          <ActionRow
            label="Request a feature"
            description="Share an improvement idea for chat, settings, or AI workflows."
            onClick={() =>
              setNotice("Feature request flow opened. Your idea is ready to capture.")
            }
          />
          <ActionRow
            label="View keyboard tips"
            description="See shortcuts for chat navigation, sending, and quick actions."
            onClick={() =>
              setNotice("Shortcut reference opened: Ctrl+/ for help, Enter to send, Esc to close.")
            }
          />
          <ActionRow
            label="Export diagnostics"
            description="Copy the current settings snapshot for support review."
            onClick={copyDiagnostics}
          />
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-mini-card">
          <strong>Support contact</strong>
          <p>support@rbtchat.local</p>
          <p>Diagnostics snapshot date: July 22, 2026</p>
        </div>
      </section>
    </div>
  );

  const renderAppearance = () => (
    <div className="settings-stack">
      <section className="settings-card">
        <h3>Theme</h3>
        <div className="settings-theme-grid">
          <button
            type="button"
            className={`settings-theme-card ${theme === "light" ? "active" : ""}`}
            onClick={() => {
              onThemeChange("light");
              setNotice("Light mode applied.");
            }}
          >
            <strong>Light mode</strong>
            <p>Bright surfaces and softer borders for daytime work.</p>
          </button>
          <button
            type="button"
            className={`settings-theme-card ${theme === "dark" ? "active" : ""}`}
            onClick={() => {
              onThemeChange("dark");
              setNotice("Dark mode applied.");
            }}
          >
            <strong>Dark mode</strong>
            <p>High-contrast panels with the same WhatsApp-inspired layout.</p>
          </button>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-group compact">
          <h3>Interface feel</h3>
          <SelectRow
            label="Density"
            description="Choose how roomy or compact the interface should feel."
            value={preferences.appearance.density}
            options={["Comfortable", "Compact", "Spacious"]}
            onChange={(nextValue) =>
              updateSection("appearance", { density: nextValue })
            }
          />
          <SelectRow
            label="Accent style"
            description="Set the highlight tone used across buttons and active states."
            value={preferences.appearance.accentStyle}
            options={[
              "Electric indigo",
              "Ocean blue",
              "Emerald green",
              "Sunset orange",
            ]}
            onChange={(nextValue) =>
              updateSection("appearance", { accentStyle: nextValue })
            }
          />
          <ToggleRow
            label="Interface animations"
            description="Keep subtle transitions for panels, menus, and toggles."
            checked={preferences.appearance.animations}
            onToggle={() =>
              updateSection("appearance", (currentSection) => ({
                ...currentSection,
                animations: !currentSection.animations,
              }))
            }
          />
        </div>
      </section>
    </div>
  );

  const renderVideo = () => (
    <section className="settings-card settings-card-large">
      <div className="settings-group compact">
        <SelectRow
          label="Camera"
          description="Choose the default camera used during video calls."
          value={preferences.video.camera}
          options={[
            "Default camera",
            "External USB camera",
            "Virtual camera",
          ]}
          onChange={(nextValue) =>
            updateSection("video", { camera: nextValue })
          }
        />
        <SelectRow
          label="Microphone"
          description="Choose the microphone used for voice capture."
          value={preferences.video.microphone}
          options={[
            "Default microphone",
            "Headset microphone",
            "Conference microphone",
          ]}
          onChange={(nextValue) =>
            updateSection("video", { microphone: nextValue })
          }
        />
        <SelectRow
          label="Speakers"
          description="Choose where call audio should be played back."
          value={preferences.video.speakers}
          options={[
            "Default speakers",
            "Bluetooth headset",
            "Monitor speakers",
          ]}
          onChange={(nextValue) =>
            updateSection("video", { speakers: nextValue })
          }
        />
      </div>
    </section>
  );

  const renderContent = () => {
    switch (section) {
      case "profile":
        return renderProfile();
      case "account":
        return renderAccount();
      case "privacy":
        return renderPrivacy();
      case "chats":
        return renderChats();
      case "ai":
        return renderAi();
      case "notifications":
        return renderNotifications();
      case "help":
        return renderHelp();
      case "appearance":
        return renderAppearance();
      case "video":
        return renderVideo();
      default:
        return renderGeneral();
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-shell">
        <SectionHeader
          title={sectionMeta[section]?.title || sectionMeta.general.title}
          description={
            sectionMeta[section]?.description || sectionMeta.general.description
          }
          onBack={goBack}
        />

        {notice ? <div className="settings-notice">{notice}</div> : null}

        {renderContent()}
      </div>
    </div>
  );
}

export default Settings;
