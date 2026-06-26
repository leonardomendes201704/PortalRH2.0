import { renderEmptyState } from "./cards.js";
import { escapeHtml } from "./html.js";

const PHOTO_ACTION_LABEL = "Adicionar fotos";

function renderComposer(composer) {
  const photoEnabled = Boolean(composer.photoEnabled);

  return `
    <form class="feed-composer-card feed-composer-form" data-action="submit-feed-post">
      <div class="feed-composer-head">
        <div>
          <h2>${escapeHtml(composer.title)}</h2>
          <p>Compartilhe uma atualização com colegas, times e lideranças.</p>
        </div>
        <button class="feed-composer-submit" type="submit" data-action="submit-feed-post">Publicar</button>
      </div>
      <div class="feed-composer-box" data-analytics="composer.focus">
        <div class="avatar" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
        <div>
          <textarea
            class="feed-composer-input feed-composer-textarea"
            name="text"
            maxlength="2000"
            rows="3"
            placeholder="${escapeHtml(composer.placeholder)}"
            aria-label="${escapeHtml(composer.placeholder)}"
          ></textarea>
          <div data-feed-attachments></div>
        </div>
      </div>
      <div class="feed-composer-actions">
        <button
          class="feed-action-chip ${photoEnabled ? "is-enabled" : ""}"
          type="button"
          data-analytics="composer.action"
          data-analytics-label="${escapeHtml(PHOTO_ACTION_LABEL)}"
          ${photoEnabled ? `data-action="open-feed-photo-modal"` : ""}
          ${photoEnabled ? "" : "disabled"}
          ${photoEnabled ? "" : `title="Disponivel em uma proxima versao"`}
        >
          <i class="fa-regular fa-image" aria-hidden="true"></i>
          <span>${escapeHtml(PHOTO_ACTION_LABEL)}</span>
        </button>
      </div>
    </form>
  `;
}

function renderPostGallery(post) {
  const images = Array.isArray(post.images) && post.images.length
    ? post.images
    : (post.image ? [{ url: post.image, description: post.imageAlt || "", aspectRatio: "free" }] : []);

  if (!images.length) {
    return "";
  }

  const total = images.length;
  const visible = images.slice(0, 4);

  return `
    <div class="post-gallery post-gallery--${Math.min(total, 4)}" data-gallery-count="${total}">
      ${visible.map((image, index) => `
        <figure
          class="post-gallery__item ${index === 3 && total > 4 ? "post-gallery__item--more" : ""}"
          data-aspect="${escapeHtml(image.aspectRatio || "free")}"
        >
          <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.description || post.author)}" loading="lazy">
          ${image.description ? `<figcaption>${escapeHtml(image.description)}</figcaption>` : ""}
          ${index === 3 && total > 4 ? `<span class="post-gallery__more">+${total - 4}</span>` : ""}
        </figure>
      `).join("")}
    </div>
  `;
}

function renderReactionBubble(type, iconClass, label) {
  return `
    <span class="reaction-bubble ${type}" aria-label="${escapeHtml(label)}">
      <i class="${escapeHtml(iconClass)}" aria-hidden="true"></i>
    </span>
  `;
}

function formatLikeLabel(count) {
  const total = Number(count ?? 0);
  if (total <= 0) {
    return "Nenhuma curtida ainda";
  }
  return total === 1 ? "1 curtida" : `${total} curtidas`;
}

function renderReactionSummary(post) {
  const count = Number(post.reactions ?? 0);

  return `
    <div class="post-reactions">
      ${count > 0 ? renderReactionBubble("like", "fa-solid fa-thumbs-up", "Curtir") : ""}
      <span data-post-reactions-count>${escapeHtml(formatLikeLabel(count))}</span>
    </div>
  `;
}

function renderPost(post) {
  const canLike = Boolean(post.postId && post.source);
  const postActions = [
    { label: "Curtir", action: canLike ? "toggle-feed-like" : "", active: post.hasLiked },
    { label: "Comentar", action: "" },
    { label: "Compartilhar", action: "" },
    { label: "Salvar", action: "" }
  ];

  return `
    <article class="post" data-post-id="${escapeHtml(post.postId)}" data-communication-id="${escapeHtml(post.communicationId)}">
      <div class="post-head">
        <div class="post-author">
          <div class="avatar" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
          <div class="post-author-copy">
            <strong>${escapeHtml(post.author)}</strong>
            <span>${escapeHtml(post.area)} • ${escapeHtml(post.timeAgo)}</span>
          </div>
        </div>
        <div class="post-more" aria-hidden="true">•••</div>
      </div>

      <div class="post-body">
        <p>${escapeHtml(post.text)}</p>
        ${post.highlightTitle ? `
          <div class="post-highlight">
            <strong>${escapeHtml(post.highlightTitle)}</strong>
            <span>${escapeHtml(post.highlightText)}</span>
          </div>
        ` : ""}
        ${renderPostGallery(post)}
        ${!Array.isArray(post.images) && post.image ? `
          <div class="post-image">
            <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt ?? post.author)}">
          </div>
        ` : ""}
      </div>

      <div class="post-stats">
        ${renderReactionSummary(post)}
        <div>${escapeHtml(post.commentsCount)} comentários • ${escapeHtml(post.sharesCount)} compartilhamentos</div>
      </div>

      <div class="post-actions">
        ${postActions.map((item) => `
          <button
            type="button"
            class="${item.label === "Curtir" && item.active ? "is-active" : ""}"
            data-post-author="${escapeHtml(post.author)}"
            ${item.action ? `data-action="${escapeHtml(item.action)}"` : ""}
            ${canLike && item.label === "Curtir" ? `data-feed-item-id="${escapeHtml(post.postId)}" data-feed-source="${escapeHtml(post.source)}"` : ""}
            ${item.label === "Curtir" ? `aria-pressed="${item.active ? "true" : "false"}"` : ""}
            data-analytics="post.action"
            data-analytics-label="${escapeHtml(post.author)}:${escapeHtml(item.label)}"
          >${escapeHtml(item.label)}</button>
        `).join("")}
      </div>

      <div class="post-comments">
        ${post.comments.map((comment) => `
          <div class="post-comment-item">
            <div class="avatar avatar--small" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
            <div class="post-comment-bubble">
              <strong>${escapeHtml(comment.author)}</strong>
              <span>${escapeHtml(comment.text)}</span>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="post-comment">
        <div class="avatar avatar--comment" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
        <div class="post-comment-box">Adicione um comentário...</div>
      </div>
    </article>
  `;
}

export function renderFeed(feed, composer) {
  const posts = Array.isArray(feed.posts) ? feed.posts : [];
  const showComposer = composer?.enabled !== false;

  return `
    <section class="card feed-card">
      <div class="card-header">${escapeHtml(feed.title)}</div>
      ${showComposer ? renderComposer(composer) : ""}
      <div class="feed-list">
        ${posts.length
          ? posts.map(renderPost).join("")
          : renderEmptyState(
            "Ainda não há posts publicados.",
            "Assim que a comunicação interna ou os times compartilharem novidades, o mural aparecerá aqui."
          )}
      </div>
    </section>
  `;
}
