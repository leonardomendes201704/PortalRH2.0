export const APP_VERSION = "v0.13.1";

export const DATA_MODES = Object.freeze({
  MOCK: "mock",
  LOCAL: "local",
  API: "api"
});

function resolveDefaultApiBaseUrl() {
  const currentWindow = getWindowObject();
  const protocol = currentWindow?.location?.protocol?.startsWith("http")
    ? currentWindow.location.protocol
    : "http:";
  const hostname = currentWindow?.location?.hostname || "localhost";

  return `${protocol}//${hostname}:3030/api`;
}

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function normalizeApiBaseUrl(candidate) {
  const value = String(candidate ?? "").trim();
  if (!value) {
    return "";
  }

  const currentWindow = getWindowObject();
  const currentHost = currentWindow?.location?.hostname || "";

  try {
    const parsed = new URL(value);
    if (!isLoopbackHost(currentHost) && isLoopbackHost(parsed.hostname)) {
      return resolveDefaultApiBaseUrl();
    }
  } catch {
    return value;
  }

  return value;
}

const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  dataMode: DATA_MODES.MOCK,
  localBasePath: "./local-api",
  apiBaseUrl: "",
  endpoints: {
    user: "/me-ui",
    feed: "/feed",
    panels: "/panels",
    carousel: "/carousel",
    communications: "/communications",
    notifications: "/notifications",
    agenda: "/agenda",
    polls: "/polls",
    portalLdapLogin: "/auth/ldap/login",
    portalSession: "/auth/session",
    portalLogout: "/auth/logout",
    adminLogin: "/admin/auth/login",
    adminSession: "/admin/auth/session",
    adminLogout: "/admin/auth/logout",
    adminLdap: "/admin/ldap",
    adminPolls: "/admin/polls",
    adminPollAssets: "/admin/polls/assets",
    adminPortalUsers: "/admin/portal-users",
    adminPortalUserStatus: "/admin/portal-users/{id}/status",
    adminPortalUserRole: "/admin/portal-users/{id}/role",
    adminPortalUserPermission: "/admin/portal-users/{id}/permissions"
  }
});

function getWindowObject() {
  return typeof window !== "undefined" ? window : undefined;
}

function getUrlParams() {
  const currentWindow = getWindowObject();
  if (!currentWindow?.location?.search) {
    return new URLSearchParams();
  }

  return new URLSearchParams(currentWindow.location.search);
}

function readStoredConfig() {
  const currentWindow = getWindowObject();
  if (!currentWindow?.localStorage) {
    return {};
  }

  try {
    return JSON.parse(currentWindow.localStorage.getItem("lioconnecta.runtimeConfig") ?? "{}");
  } catch {
    return {};
  }
}

function normalizeMode(mode) {
  return Object.values(DATA_MODES).includes(mode) ? mode : DEFAULT_RUNTIME_CONFIG.dataMode;
}

function joinUrl(base, path) {
  if (!base) {
    return path;
  }

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function getRuntimeConfig() {
  const stored = readStoredConfig();
  const params = getUrlParams();

  const dataMode = normalizeMode(
    params.get("dataMode") ??
    stored.dataMode ??
    DEFAULT_RUNTIME_CONFIG.dataMode
  );

  const localBasePath = params.get("localBasePath") ?? stored.localBasePath ?? DEFAULT_RUNTIME_CONFIG.localBasePath;
  const apiBaseUrl = normalizeApiBaseUrl(
    params.get("apiBaseUrl") ??
    stored.apiBaseUrl ??
    resolveDefaultApiBaseUrl()
  );

  return {
    version: APP_VERSION,
    dataMode,
    localBasePath,
    apiBaseUrl,
    endpoints: {
      ...DEFAULT_RUNTIME_CONFIG.endpoints,
      ...(stored.endpoints ?? {})
    }
  };
}

export function resolveDataSource(domain) {
  const config = getRuntimeConfig();

  const mockSources = {
    user: "./assets/data/user.json",
    feed: "./assets/data/feed.json",
    panels: "./assets/data/panels.json",
    carousel: "./assets/data/carousel.json",
    communications: "./assets/data/communications.json"
  };

  const localSources = {
    user: `${config.localBasePath}/user.json`,
    feed: `${config.localBasePath}/feed.json`,
    panels: `${config.localBasePath}/panels.json`,
    carousel: `${config.localBasePath}/carousel.json`,
    communications: `${config.localBasePath}/communications.json`
  };

  const apiSources = {
    user: joinUrl(config.apiBaseUrl, config.endpoints.user),
    feed: joinUrl(config.apiBaseUrl, config.endpoints.feed),
    panels: joinUrl(config.apiBaseUrl, config.endpoints.panels),
    carousel: joinUrl(config.apiBaseUrl, config.endpoints.carousel),
    communications: joinUrl(config.apiBaseUrl, config.endpoints.communications),
    notifications: joinUrl(config.apiBaseUrl, config.endpoints.notifications),
    agenda: joinUrl(config.apiBaseUrl, config.endpoints.agenda)
  };

  const sourceMap = {
    [DATA_MODES.MOCK]: mockSources,
    [DATA_MODES.LOCAL]: localSources,
    [DATA_MODES.API]: apiSources
  };

  return sourceMap[config.dataMode][domain];
}

export function resolveApiEndpoint(domain) {
  const config = getRuntimeConfig();
  const endpoint = config.endpoints?.[domain];

  if (!endpoint) {
    throw new Error(`Endpoint nao configurado para o dominio "${domain}".`);
  }

  return joinUrl(config.apiBaseUrl, endpoint);
}

export function usesEnvelope(mode = getRuntimeConfig().dataMode) {
  return mode === DATA_MODES.LOCAL || mode === DATA_MODES.API;
}
