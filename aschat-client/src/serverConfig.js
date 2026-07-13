const LOCAL_SERVER_ORIGIN = "http://localhost:5000";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const trimTrailingSlash = (value = "") =>
  String(value).trim().replace(/\/+$/, "");

const toApiBaseUrl = (value = "") => {
  const normalizedValue = trimTrailingSlash(value);

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue.endsWith("/api")
    ? normalizedValue
    : `${normalizedValue}/api`;
};

const uniqueValues = (values) => Array.from(new Set(values.filter(Boolean)));

const configuredApiBaseUrl = toApiBaseUrl(import.meta.env.VITE_API_URL);
const configuredServerOrigin = trimTrailingSlash(
  import.meta.env.VITE_SERVER_ORIGIN ||
    import.meta.env.VITE_SERVER_URL ||
    import.meta.env.VITE_SOCKET_URL
);
const inferredServerOrigin = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/api$/, "")
  : "";
const isLocalBrowser =
  typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname);

export const SERVER_ORIGINS = uniqueValues([
  configuredServerOrigin || inferredServerOrigin,
  isLocalBrowser ? LOCAL_SERVER_ORIGIN : "",
  LOCAL_SERVER_ORIGIN,
]);

export const API_BASE_URLS = uniqueValues([
  configuredApiBaseUrl,
  ...SERVER_ORIGINS.map(toApiBaseUrl),
]);

export const SOCKET_URLS = uniqueValues([
  configuredServerOrigin || inferredServerOrigin,
  isLocalBrowser ? LOCAL_SERVER_ORIGIN : "",
  LOCAL_SERVER_ORIGIN,
]);

export const PRIMARY_SERVER_ORIGIN =
  SERVER_ORIGINS[0] || LOCAL_SERVER_ORIGIN;
export const PRIMARY_API_BASE_URL =
  API_BASE_URLS[0] || `${PRIMARY_SERVER_ORIGIN}/api`;
export const PRIMARY_SOCKET_URL =
  SOCKET_URLS[0] || PRIMARY_SERVER_ORIGIN;
