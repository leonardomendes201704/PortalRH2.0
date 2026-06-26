import { renderEmptyState } from "./cards.js";
import { escapeHtml } from "./html.js";

const COMPOSER_ACTION_ICONS = {
  Foto: "fa-regular fa-image",
  Evento: "fa-regular fa-calendar",
  Comunicado: "fa-solid fa-bullhorn",
  Conquista: "fa-solid fa-trophy"
};

function renderComposer(composer) {
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
            required
          ></textarea>
          <span class="feed-composer-helper">Posts de texto ficam visiveis para toda a companhia no mural da LIOCONNECTA.</span>
        </div>
      </div>
      <div class="feed-composer-actions">
        ${composer.actions.map((action) => `
          <button
            class="feed-action-chip"
            type="button"
            data-analytics="composer.action"
            data-analytics-label="${escapeHtml(action)}"
            disabled
            title="Disponivel em uma proxima versao"
          >
            <i class="${escapeHtml(COMPOSER_ACTION_ICONS[action] || "fa-solid fa-plus")}" aria-hidden="true"></i>
            <span>${escapeHtml(action)}</span>
          </button>
        `).join("")}
      </div>
    </form>
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
        ${post.image ? `
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
