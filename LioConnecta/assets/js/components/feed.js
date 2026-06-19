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
    <div class="feed-composer-card">
      <div class="feed-composer-head">
        <div>
          <h2>${escapeHtml(composer.title)}</h2>
          <p>Compartilhe uma atualização com colegas, times e lideranças.</p>
        </div>
        <button class="feed-composer-submit" type="button" data-analytics="composer.publish">Publicar</button>
      </div>
      <div class="feed-composer-box" data-analytics="composer.focus">
        <div class="avatar" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
        <div>
          <div class="feed-composer-input" role="textbox" aria-label="${escapeHtml(composer.placeholder)}">
            ${escapeHtml(composer.placeholder)}
          </div>
          <span class="feed-composer-helper">Posts institucionais e sociais aparecem no mural da LIOCONNECTA.</span>
        </div>
      </div>
      <div class="feed-composer-actions">
        ${composer.actions.map((action) => `
          <button
            class="feed-action-chip"
            type="button"
            data-analytics="composer.action"
            data-analytics-label="${escapeHtml(action)}"
          >
            <i class="${escapeHtml(COMPOSER_ACTION_ICONS[action] || "fa-solid fa-plus")}" aria-hidden="true"></i>
            <span>${escapeHtml(action)}</span>
          </button>
        `).join("")}
      </div>
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

function renderPost(post) {
  return `
    <article class="post">
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
        <div class="post-reactions">
          ${renderReactionBubble("like", "fa-solid fa-thumbs-up", "Curtir")}
          ${renderReactionBubble("clap", "fa-solid fa-hands-clapping", "Aplaudir")}
          ${renderReactionBubble("love", "fa-solid fa-heart", "Amei")}
          <span>${escapeHtml(post.reactions)} reações</span>
        </div>
        <div>${escapeHtml(post.commentsCount)} comentários • ${escapeHtml(post.sharesCount)} compartilhamentos</div>
      </div>

      <div class="post-actions">
        ${["Curtir", "Comentar", "Compartilhar", "Salvar"].map((action) => `
          <button
            type="button"
            data-post-author="${escapeHtml(post.author)}"
            data-analytics="post.action"
            data-analytics-label="${escapeHtml(post.author)}:${escapeHtml(action)}"
          >${escapeHtml(action)}</button>
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

  return `
    <section class="card feed-card">
      <div class="card-header">${escapeHtml(feed.title)}</div>
      ${renderComposer(composer)}
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
