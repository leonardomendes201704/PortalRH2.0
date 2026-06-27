import { getJson, postJson, postWithoutBody } from "./apiClient.js";
import { resolveApiEndpoint } from "../core/runtimeConfig.js";

const STORAGE_KEY = "lioconnecta.adminSession";
const DEFAULT_ADMIN_HASH = "#comunicacao/restrita";

function getStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function normalizeSession(payload) {
  if (!payload?.token || !payload?.expiresAtUtc || !payload?.user?.username) {
    return null;
  }

  return {
    token: String(payload.token),
    expiresAtUtc: String(payload.expiresAtUtc),
    user: {
      id: String(payload.user.id ?? ""),
      username: String(payload.user.username ?? ""),
      displayName: String(payload.user.displayName ?? ""),
      role: String(payload.user.role ?? "")
    }
  };
}

function isExpired(expiresAtUtc) {
  const expiresAt = new Date(expiresAtUtc).getTime();
  return !expiresAt || Number.isNaN(expiresAt) || expiresAt <= Date.now();
}

export function getStoredAdminSession() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    const session = normalizeSession(raw);
    if (!session || isExpired(session.expiresAtUtc)) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function storeAdminSession(payload) {
  const storage = getStorage();
  const session = normalizeSession(payload);

  if (!storage || !session) {
    return null;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearAdminSession() {
  const storage = getStorage();
  storage?.removeItem(STORAGE_KEY);
}

export function getAdminAuthHeaders() {
  const session = getStoredAdminSession();
  return session?.token
    ? {
      "X-Admin-Token": session.token,
      Authorization: `Bearer ${session.token}`
    }
    : {};
}

export function isSuperAdminSession(session = getStoredAdminSession()) {
  const role = String(session?.user?.role ?? "").trim().toLowerCase();
  return role === "superadmin";
}

export async function loginAdmin(username, password) {
  const response = await postJson(resolveApiEndpoint("adminLogin"), {
    username,
    password
  });

  return storeAdminSession(response);
}

export async function fetchAdminSession() {
  const session = getStoredAdminSession();
  if (!session) {
    return null;
  }

  const payload = await getJson(resolveApiEndpoint("adminSession"), {
    headers: getAdminAuthHeaders()
  });

  return storeAdminSession(payload);
}

export async function logoutAdmin() {
  const session = getStoredAdminSession();

  if (session?.token) {
    try {
      await postWithoutBody(resolveApiEndpoint("adminLogout"), {
        headers: getAdminAuthHeaders()
      });
    } catch {
      // Ignora falha remota e encerra sessao localmente.
    }
  }

  clearAdminSession();
}

export function buildAdminLoginUrl(nextHash = DEFAULT_ADMIN_HASH) {
  return `./admin/?next=${encodeURIComponent(nextHash || DEFAULT_ADMIN_HASH)}`;
}

export function redirectToAdminLogin(nextHash = DEFAULT_ADMIN_HASH) {
  if (typeof window === "undefined") {
    return;
  }

  window.location.href = buildAdminLoginUrl(nextHash);
}

export function resolvePostLoginTarget() {
  if (typeof window === "undefined") {
    return DEFAULT_ADMIN_HASH;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("next") || DEFAULT_ADMIN_HASH;
}
