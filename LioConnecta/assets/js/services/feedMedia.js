import { getRuntimeConfig } from "../core/runtimeConfig.js";

function resolveUploadsOrigin() {
  const apiBase = String(getRuntimeConfig().apiBaseUrl || "").trim();
  if (!apiBase) {
    return "";
  }

  return apiBase.replace(/\/api\/?$/i, "");
}

export function resolveFeedMediaUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.includes("/uploads/feed/")) {
        const origin = resolveUploadsOrigin();
        return origin ? `${origin}${parsed.pathname}` : value;
      }
    } catch {
      return value;
    }

    return value;
  }

  if (value.startsWith("/uploads/")) {
    const origin = resolveUploadsOrigin();
    return origin ? `${origin}${value}` : value;
  }

  return value;
}

export function serializeGalleryImages(images = []) {
  return encodeURIComponent(JSON.stringify(images.map((image) => ({
    id: String(image.id || ""),
    url: String(image.url || ""),
    description: String(image.description || ""),
    aspectRatio: String(image.aspectRatio || "free"),
    commentCount: Number(image.commentCount ?? 0)
  }))));
}

export function parseGalleryImages(rawValue) {
  if (!rawValue) {
    return [];
  }

  const attempts = [
    () => JSON.parse(decodeURIComponent(rawValue)),
    () => JSON.parse(rawValue)
  ];

  for (const attempt of attempts) {
    try {
      const parsed = attempt();
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // tenta o proximo formato
    }
  }

  return [];
}

export function readGalleryImages(gallery) {
  const parsed = parseGalleryImages(gallery?.getAttribute("data-feed-gallery"));
  if (parsed.length) {
    return parsed;
  }

  return Array.from(gallery?.querySelectorAll(".post-gallery__item[data-photo-url]") || [])
    .map((button) => ({
      id: button.getAttribute("data-photo-id") || "",
      url: button.getAttribute("data-photo-url") || "",
      description: button.getAttribute("data-photo-description") || "",
      aspectRatio: button.getAttribute("data-photo-aspect") || "free",
      commentCount: Number(button.getAttribute("data-photo-comment-count") || 0)
    }))
    .filter((item) => item.url);
}
