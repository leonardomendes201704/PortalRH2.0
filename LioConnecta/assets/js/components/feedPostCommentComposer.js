import { escapeHtml } from "./html.js";
import { DATA_MODES, getRuntimeConfig } from "../core/runtimeConfig.js?v=0.21.3";
import { createFeedPostComment } from "../services/feedService.js?v=0.21.3";
import { getPortalAuthHeaders } from "../services/portalAuthService.js?v=0.17.0";
import { showToast } from "../core/feedback.js?v=0.16.0";
import { canInteractWithFeed } from "../services/portalPermissionService.js?v=0.17.0";
import {
  bindMentionField,
  renderMentionBody,
  renderMentionDropdownMarkup
} from "./feedMentions.js?v=0.21.3";

const mentionControls = new WeakMap();

function canCommentOnPosts() {
  return getRuntimeConfig().dataMode === DATA_MODES.API && canInteractWithFeed();
}

function formatCommentsLabel(count) {
  const total = Number(count ?? 0);
  return total === 1 ? "1 comentário" : `${total} comentários`;
}

export function renderCommentBody(comment = {}) {
  return renderMentionBody(comment);
}

export function renderPostCommentComposer(post) {
  const postId = String(post.postId || "");
  const isUserPost = String(post.source || "") === "UserPost";
  const enabled = Boolean(postId && isUserPost && canCommentOnPosts());

  if (!enabled) {
    return `
      <div class="post-comment post-comment--readonly">
        <div class="avatar avatar--comment" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
        <div class="post-comment-box" aria-hidden="true">Adicione um comentário...</div>
      </div>
    `;
  }

  return `
    <form
      class="post-comment post-comment-composer"
      data-action="submit-feed-post-comment"
      data-post-id="${escapeHtml(postId)}"
    >
      <div class="avatar avatar--comment" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
      <div class="post-comment-composer__main">
        <div class="post-comment-composer__field feed-mention-field">
          <textarea
            class="post-comment-input"
            name="text"
            rows="1"
            maxlength="2000"
            placeholder="Adicione um comentário..."
            aria-label="Adicione um comentário"
            autocomplete="off"
            autocorrect="off"
            spellcheck="true"
          ></textarea>
          ${renderMentionDropdownMarkup()}
        </div>
        <button type="submit" class="post-comment-submit" disabled>Comentar</button>
      </div>
    </form>
  `;
}

function resizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

function renderCommentItem(comment) {
  return `
    <div class="post-comment-item" data-comment-id="${escapeHtml(comment.id || "")}">
      <div class="avatar avatar--small" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
      <div class="post-comment-bubble">
        <strong>${escapeHtml(comment.author || "Colaborador")}</strong>
        <span class="post-comment-text">${renderCommentBody(comment)}</span>
      </div>
    </div>
  `;
}

function updatePostCommentCount(postEl, count) {
  const statsRow = postEl.querySelector(".post-stats > div:last-child");
  if (!statsRow) {
    return;
  }

  const sharesMatch = statsRow.textContent?.match(/(\d+)\s+compartilhamentos/);
  const shares = sharesMatch ? sharesMatch[1] : "0";
  statsRow.textContent = `${formatCommentsLabel(count)} • ${shares} compartilhamentos`;
}

function appendCommentToPost(postEl, comment) {
  let list = postEl.querySelector(".post-comments");
  if (!list) {
    list = document.createElement("div");
    list.className = "post-comments";
    const composer = postEl.querySelector(".post-comment-composer, .post-comment--readonly");
    postEl.insertBefore(list, composer || null);
  }

  list.insertAdjacentHTML("beforeend", renderCommentItem(comment));
  const currentCount = postEl.querySelectorAll(".post-comment-item").length;
  updatePostCommentCount(postEl, currentCount);
}

function resetComposerForm(form) {
  const textarea = form.querySelector(".post-comment-input");
  const submitButton = form.querySelector(".post-comment-submit");
  const mentionControl = mentionControls.get(form);

  if (textarea) {
    textarea.value = "";
    resizeTextarea(textarea);
  }

  mentionControl?.resetMentions();

  if (submitButton) {
    submitButton.disabled = true;
  }
}

function bindComposerForm(form) {
  const textarea = form.querySelector(".post-comment-input");
  const submitButton = form.querySelector(".post-comment-submit");
  const fieldRoot = form.querySelector(".post-comment-composer__field");
  if (!textarea || !submitButton || !fieldRoot) {
    return;
  }

  resizeTextarea(textarea);

  const mentionControl = bindMentionField({
    fieldRoot,
    textarea,
    onSync: () => {
      resizeTextarea(textarea);
      submitButton.disabled = !textarea.value.trim();
    }
  });
  mentionControls.set(form, mentionControl);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const postId = form.getAttribute("data-post-id") || "";
    const text = textarea.value.trim();
    if (!postId || !text) {
      return;
    }

    submitButton.disabled = true;

    try {
      const comment = await createFeedPostComment(
        postId,
        {
          text,
          mentionedUserIds: mentionControl.getMentionedUserIds()
        },
        { headers: getPortalAuthHeaders() }
      );

      const postEl = form.closest(".post");
      if (postEl && comment) {
        appendCommentToPost(postEl, comment);
      }

      resetComposerForm(form);
      showToast("Comentario publicado.", "success");
    } catch (error) {
      console.error("Falha ao comentar no post.", error);
      const message = error instanceof Error && error.message.includes("HTTP 401")
        ? "Sua sessao expirou. Faca login novamente para comentar."
        : "Nao foi possivel publicar o comentario agora.";
      showToast(message, "error");
      submitButton.disabled = !textarea.value.trim();
    }
  });
}

export function bindFeedPostCommentActions(root = document) {
  if (!canCommentOnPosts()) {
    return;
  }

  const forms = Array.from(root.querySelectorAll("[data-action='submit-feed-post-comment']"));
  forms.forEach((form) => {
    if (form.dataset.commentComposerBound === "true") {
      return;
    }
    form.dataset.commentComposerBound = "true";
    bindComposerForm(form);
  });
}
