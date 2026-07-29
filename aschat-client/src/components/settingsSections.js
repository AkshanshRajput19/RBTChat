export const SETTINGS_SECTION_PAGE = {
  general: "settings",
  profile: "profile",
  account: "settings-account",
  privacy: "settings-privacy",
  chats: "settings-chats",
  ai: "settings-ai",
  notifications: "settings-notifications",
  help: "settings-help",
  appearance: "settings-appearance",
  video: "settings-video",
};

const SETTINGS_PAGE_SECTION = Object.entries(SETTINGS_SECTION_PAGE).reduce(
  (map, [section, page]) => ({
    ...map,
    [page]: section,
  }),
  {}
);

const PAGE_TITLES = {
  dashboard: "Dashboard",
  users: "Users",
  chats: "Chats",
  ai: "AI",
  subscription: "Subscription Overview",
  allSubscriptions: "All Subscriptions",
  pendingRequests: "Pending Requests",
  plans: "Plans & Packages",
  addPlan: "Add Plan",
  pwaSettings: "PWA Settings",
  paymentHistory: "Payment History",
  customDomain: "Custom Domain",
  settings: "General",
  profile: "Profile",
  "settings-account": "Account",
  "settings-privacy": "Privacy",
  "settings-chats": "Chats",
  "settings-ai": "AI Settings",
  "settings-notifications": "Notifications",
  "settings-help": "Help & Feedback",
  "settings-appearance": "Appearance",
  "settings-video": "Video & voice",
};

export function getSettingsSection(page) {
  return SETTINGS_PAGE_SECTION[page] || null;
}

export function getSettingsPageForSection(section) {
  return SETTINGS_SECTION_PAGE[section] || "settings";
}

export function isSettingsLikePage(page) {
  return Boolean(getSettingsSection(page));
}

export function getPageTitle(page) {
  return PAGE_TITLES[page] || "Chats";
}
