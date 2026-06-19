const STORAGE_KEY = "lioconnecta.publishedCommunications";

function getWindowObject() {
  return typeof window !== "undefined" ? window : undefined;
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function readStore() {
  const currentWindow = getWindowObject();
  if (!currentWindow?.localStorage) {
    return [];
  }

  return safeParse(currentWindow.localStorage.getItem(STORAGE_KEY) ?? "[]");
}

function writeStore(items) {
  const currentWindow = getWindowObject();
  if (!currentWindow?.localStorage) {
    return;
  }

  currentWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
}

function normalizeStoredItem(item = {}) {
  return {
    slug: String(item.slug || ""),
    category: String(item.category || "Corporativo"),
    priority: String(item.priority || "Comunicado"),
    title: String(item.title || "Comunicado"),
    summary: String(item.summary || ""),
    publishedAt: String(item.publishedAt || ""),
    audience: String(item.audience || "Toda a companhia"),
    channel: String(item.channel || "Portal"),
    status: String(item.status || "Publicado"),
    attachmentLabel: String(item.attachmentLabel || "Abrir anexo"),
    owner: String(item.owner || "Comunicacao Corporativa"),
    image: String(item.image || ""),
    imageAlt: String(item.imageAlt || ""),
    body: Array.isArray(item.body) ? item.body.map((paragraph) => String(paragraph)).filter(Boolean) : []
  };
}

export function getPublishedCommunications() {
  return readStore().map(normalizeStoredItem);
}

export function savePublishedCommunication(payload = {}) {
  const items = getPublishedCommunications();
  const timestamp = new Date();
  const dateLabel = timestamp.toLocaleDateString("pt-BR");
  const generatedSlug = slugify(payload.title || payload.summary || `comunicado-${Date.now()}`);

  const item = normalizeStoredItem({
    ...payload,
    slug: payload.slug || generatedSlug || `comunicado-${Date.now()}`,
    publishedAt: payload.publishedAt || dateLabel,
    status: payload.status || "Publicado"
  });

  writeStore([item, ...items]);
  return item;
}
