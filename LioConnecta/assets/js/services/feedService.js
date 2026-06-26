import { getJson, postJson } from "./apiClient.js";
import { unwrapDataEnvelope } from "./apiClient.js";
import { mapFeedViewModel } from "../mappers/feedMapper.js";
import { validateFeedContract } from "../validators/feedValidator.js";
import { DATA_MODES, getRuntimeConfig, resolveApiEndpoint, resolveDataSource, usesEnvelope } from "../core/runtimeConfig.js";
import { getPortalAuthHeaders } from "./portalAuthService.js";
import { DEFAULT_FEED_TITLE } from "../view-models/defaults.js";

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

function mapFeedItemToPost(item = {}) {
  const source = String(item.source || "");
  const isCommunication = source === "Communication";

  return {
    postId: String(item.id || ""),
    source,
    communicationId: isCommunication ? String(item.communicationId || item.id || "") : "",
    slug: "",
    author: String(item.author || "Colaborador"),
    area: String(item.area || "Companhia"),
    timeAgo: formatTimeAgo(item.publishedAtUtc),
    text: String(item.text || ""),
    highlightTitle: String(item.highlightTitle || ""),
    highlightText: String(item.highlightText || ""),
    image: String(item.imageUrl || ""),
    imageAlt: String(item.highlightTitle || item.author || "Publicacao"),
    reactions: Number(item.likeCount ?? 0),
    hasLiked: Boolean(item.hasLiked),
    commentsCount: 0,
    sharesCount: 0,
    comments: []
  };
}

function mapApiFeedPayload(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  return {
    title: String(payload.title || DEFAULT_FEED_TITLE),
    posts: items.map(mapFeedItemToPost).filter((post) => post.text || post.image)
  };
}

export async function getFeedData() {
  const config = getRuntimeConfig();

  if (config.dataMode === DATA_MODES.API) {
    try {
      const payload = await getJson(resolveApiEndpoint("feed"), {
        headers: getPortalAuthHeaders()
      });
      return mapFeedViewModel(mapApiFeedPayload(payload), { allowDefaults: false });
    } catch (error) {
      console.error("Falha ao carregar feed do portal.", error);
      return mapFeedViewModel({ title: DEFAULT_FEED_TITLE, posts: [] }, { allowDefaults: false });
    }
  }

  const rawPayload = await getJson(resolveDataSource("feed"));
  const raw = usesEnvelope(config.dataMode) ? unwrapDataEnvelope(rawPayload) : rawPayload;
  validateFeedContract(raw);
  return mapFeedViewModel(raw);
}

export async function createFeedPost(text, options = {}) {
  const payload = await postJson(resolveApiEndpoint("feed"), { text }, options);
  return mapFeedItemToPost(payload?.item || payload);
}

export async function toggleFeedLike(itemId, source, options = {}) {
  return postJson(`${resolveApiEndpoint("feed")}/${encodeURIComponent(itemId)}/like`, { source }, options);
}

function formatLikeLabel(count) {
  const total = Number(count ?? 0);
  if (total <= 0) {
    return "Nenhuma curtida ainda";
  }
  return total === 1 ? "1 curtida" : `${total} curtidas`;
}

export function updatePostLikeState(post, result) {
  updateFeedLikeUi(post, result);
}

export function updateCommunicationLikeUi(scope, result) {
  updateFeedLikeUi(scope, result);
}

export function updateFeedLikeUi(scope, result) {
  if (!scope || !result) {
    return;
  }

  const likeButton = scope.querySelector("[data-action='toggle-feed-like'], [data-action='toggle-communication-like']");
  const reactionsLabel = scope.querySelector("[data-post-reactions-count], [data-communication-like-count]");
  const reactionsRow = scope.querySelector(".post-reactions");
  const likeCount = Number(result.likeCount ?? 0);

  if (likeButton) {
    likeButton.classList.toggle("is-active", Boolean(result.hasLiked));
    likeButton.setAttribute("aria-pressed", result.hasLiked ? "true" : "false");
  }

  if (reactionsLabel) {
    reactionsLabel.textContent = scope.classList.contains("communication-detail-card")
      ? String(likeCount)
      : formatLikeLabel(likeCount);
  }

  if (reactionsRow) {
    const existingBubble = reactionsRow.querySelector(".reaction-bubble.like");
    if (likeCount > 0 && !existingBubble) {
      reactionsRow.insertAdjacentHTML("afterbegin", `
        <span class="reaction-bubble like" aria-label="Curtir">
          <i class="fa-solid fa-thumbs-up" aria-hidden="true"></i>
        </span>
      `);
    }
    if (likeCount <= 0 && existingBubble) {
      existingBubble.remove();
    }
  }
}
