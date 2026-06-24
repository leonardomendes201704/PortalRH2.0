import { getJson } from "./apiClient.js";
import { unwrapDataEnvelope } from "./apiClient.js";
import { mapFeedViewModel } from "../mappers/feedMapper.js";
import { validateFeedContract } from "../validators/feedValidator.js";
import { DATA_MODES, getRuntimeConfig, resolveDataSource, usesEnvelope } from "../core/runtimeConfig.js";
import { listCommunications } from "./communicationService.js";
import { getPortalAuthHeaders } from "./portalAuthService.js";
import { DEFAULT_FEED_TITLE } from "../view-models/defaults.js";

function normalizeKey(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatTimeAgo(value) {
  if (!value) {
    return "agora";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "agora";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "agora";
  }
  if (minutes < 60) {
    return `há ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `há ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function mapCommunicationToFeedPost(item = {}) {
  const status = normalizeKey(item.status);
  if (!status.includes("publicado")) {
    return null;
  }

  const title = String(item.title || "").trim();
  const summary = String(item.summary || "").trim();
  const body = String(item.body || "").trim();

  return {
    communicationId: String(item.id || ""),
    slug: String(item.slug || ""),
    author: String(item.owner || "Comunicação Corporativa"),
    area: String(item.category || "Corporativo"),
    timeAgo: formatTimeAgo(item.publishedAt),
    text: summary || body,
    highlightTitle: title,
    highlightText: summary,
    image: String(item.imageUrl || ""),
    imageAlt: title || "Comunicado oficial",
    reactions: Number(item.likeCount ?? 0),
    hasLiked: Boolean(item.hasLiked),
    commentsCount: 0,
    sharesCount: 0,
    comments: []
  };
}

function buildFeedFromCommunications(items = []) {
  const posts = items
    .map(mapCommunicationToFeedPost)
    .filter(Boolean);

  return {
    title: DEFAULT_FEED_TITLE,
    posts
  };
}

export async function getFeedData() {
  const config = getRuntimeConfig();

  if (config.dataMode === DATA_MODES.API) {
    try {
      const items = await listCommunications({ headers: getPortalAuthHeaders() });
      return mapFeedViewModel(buildFeedFromCommunications(items));
    } catch (error) {
      console.error("Falha ao carregar feed de comunicados.", error);
      return mapFeedViewModel({ title: DEFAULT_FEED_TITLE, posts: [] });
    }
  }

  const rawPayload = await getJson(resolveDataSource("feed"));
  const raw = usesEnvelope(config.dataMode) ? unwrapDataEnvelope(rawPayload) : rawPayload;
  validateFeedContract(raw);
  return mapFeedViewModel(raw);
}

export function updatePostLikeState(post, result) {
  updateCommunicationLikeUi(post, result);
}

export function updateCommunicationLikeUi(scope, result) {
  if (!scope || !result) {
    return;
  }

  const likeButton = scope.querySelector("[data-action='toggle-communication-like']");
  const reactionsLabel = scope.querySelector("[data-post-reactions-count], [data-communication-like-count]");

  if (likeButton) {
    likeButton.classList.toggle("is-active", Boolean(result.hasLiked));
    likeButton.setAttribute("aria-pressed", result.hasLiked ? "true" : "false");
  }

  if (reactionsLabel) {
    reactionsLabel.textContent = scope.classList.contains("communication-detail-card")
      ? String(Number(result.likeCount ?? 0))
      : `${Number(result.likeCount ?? 0)} reações`;
  }
}
