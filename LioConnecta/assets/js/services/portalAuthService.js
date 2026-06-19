import { postJson } from "./apiClient.js";
import { resolveApiEndpoint } from "../core/runtimeConfig.js";

const STORAGE_KEY = "lioconnecta.portalSession";
const DEFAULT_PORTAL_HASH = "#inicio";

function getStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function normalizeSession(payload) {
  if (!payload?.token || !payload?.expiresAtUtc || !payload?.user?.displayName) {
    return null;
  }

  return {
    token: String(payload.token),
    expiresAtUtc: String(payload.expiresAtUtc),
    user: {
      id: String(payload.user.id ?? ""),
      login: String(payload.user.login ?? ""),
      displayName: String(payload.user.displayName ?? ""),
      email: String(payload.user.email ?? ""),
      department: String(payload.user.department ?? ""),
      title: String(payload.user.title ?? "")
    }
  };
}

function isExpired(expiresAtUtc) {
  const expiresAt = new Date(expiresAtUtc).getTime();
  return !expiresAt || Number.isNaN(expiresAt) || expiresAt <= Date.now();
}

export function getStoredPortalSession() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    const session = normalizeSession(raw);
    if (!session || isExpired(session.expiresAtUtc)) {
      clearPortalSession();
      return null;
    }

    return session;
  } catch {
    clearPortalSession();
    return null;
  }
}

export function storePortalSession(payload) {
  const storage = getStorage();
  const session = normalizeSession(payload);

  if (!storage || !session) {
    return null;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearPortalSession() {
  const storage = getStorage();
  storage?.removeItem(STORAGE_KEY);
}

export async function loginWithLdap(login, password) {
  const response = await postJson(resolveApiEndpoint("portalLdapLogin"), {
    login,
    password
  });

  return storePortalSession(response);
}

export function buildPortalLoginUrl(nextHash = DEFAULT_PORTAL_HASH) {
  return `./login/?next=${encodeURIComponent(nextHash || DEFAULT_PORTAL_HASH)}`;
}

export function redirectToPortalLogin(nextHash = DEFAULT_PORTAL_HASH) {
  if (typeof window === "undefined") {
    return;
  }

  window.location.href = buildPortalLoginUrl(nextHash);
}

export function resolvePortalPostLoginTarget() {
  if (typeof window === "undefined") {
    return DEFAULT_PORTAL_HASH;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("next") || DEFAULT_PORTAL_HASH;
}
