import { getJson, postFormData, postJson } from "./apiClient.js";
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
  const media = Array.isArray(item.media) ? item.media : [];
  const images = media.map((entry) => ({
    id: String(entry.id || ""),
    url: String(entry.url || ""),
    description: String(entry.description || ""),
    aspectRatio: String(entry.aspectRatio || "free"),
    commentCount: Number(entry.commentCount ?? 0)
  })).filter((entry) => entry.url);

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
    image: String(item.imageUrl || images[0]?.url || ""),
    imageAlt: String(item.highlightTitle || images[0]?.description || item.author || "Publicacao"),
    images,
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
    posts: items.map(mapFeedItemToPost).filter((post) => post.text || post.image || post.images.length)
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

export async function uploadFeedAsset(file, options = {}) {
  const formData = new FormData();
  formData.append("file", file, file.name || "feed-photo.jpg");
  return postFormData(resolveApiEndpoint("feedAssets"), formData, options);
}

export async function createFeedPost(payload, options = {}) {
  const body = typeof payload === "string"
    ? { text: payload, media: [] }
    : {
      text: String(payload?.text || ""),
      media: Array.isArray(payload?.media) ? payload.media : []
    };

  const response = await postJson(resolveApiEndpoint("feed"), body, options);
  return mapFeedItemToPost(response?.item || response);
}

export async function toggleFeedLike(itemId, source, options = {}) {
  return postJson(`${resolveApiEndpoint("feed")}/${encodeURIComponent(itemId)}/like`, { source }, options);
}

export async function getFeedMediaComments(mediaId, options = {}) {
  return getJson(`${resolveApiEndpoint("feed")}/media/${encodeURIComponent(mediaId)}/comments`, options);
}

export async function createFeedMediaComment(mediaId, text, options = {}) {
  const payload = await postJson(
    `${resolveApiEndpoint("feed")}/media/${encodeURIComponent(mediaId)}/comments`,
    { text },
    options
  );
  return mapMediaComment(payload?.item || payload);
}

function mapMediaComment(item = {}) {
  return {
    id: String(item.id || ""),
    author: String(item.author || "Colaborador"),
    text: String(item.text || ""),
    createdAtUtc: item.createdAtUtc || null
  };
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
