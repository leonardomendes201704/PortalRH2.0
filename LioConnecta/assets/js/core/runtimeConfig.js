export const APP_VERSION = "v0.11.3";

export const DATA_MODES = Object.freeze({
  MOCK: "mock",
  LOCAL: "local",
  API: "api"
});

const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  dataMode: DATA_MODES.MOCK,
  localBasePath: "./local-api",
  apiBaseUrl: "http://localhost:5001/api",
  endpoints: {
    user: "/me-ui",
    feed: "/feed",
    panels: "/panels",
    carousel: "/carousel",
    communications: "/communications",
    portalLdapLogin: "/auth/ldap/login",
    adminLogin: "/admin/auth/login",
    adminSession: "/admin/auth/session",
    adminLogout: "/admin/auth/logout",
    adminLdap: "/admin/ldap"
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
  const apiBaseUrl = params.get("apiBaseUrl") ?? stored.apiBaseUrl ?? DEFAULT_RUNTIME_CONFIG.apiBaseUrl;

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
    communications: joinUrl(config.apiBaseUrl, config.endpoints.communications)
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
    throw new Error(`Endpoint não configurado para o domínio "${domain}".`);
  }

  return joinUrl(config.apiBaseUrl, endpoint);
}

export function usesEnvelope(mode = getRuntimeConfig().dataMode) {
  return mode === DATA_MODES.LOCAL || mode === DATA_MODES.API;
}
