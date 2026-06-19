export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function asString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}
