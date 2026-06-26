import { escapeHtml } from "./html.js";
import { DATA_MODES, getRuntimeConfig } from "../core/runtimeConfig.js?v=0.21.1";
import { createFeedPostComment, suggestFeedMentions } from "../services/feedService.js?v=0.21.1";
import { getPortalAuthHeaders } from "../services/portalAuthService.js?v=0.17.0";
import { showToast } from "../core/feedback.js?v=0.16.0";
import { canInteractWithFeed } from "../services/portalPermissionService.js?v=0.17.0";

const composerState = new WeakMap();
const suggestTimers = new WeakMap();

function canCommentOnPosts() {
  return getRuntimeConfig().dataMode === DATA_MODES.API && canInteractWithFeed();
}

function formatCommentsLabel(count) {
  const total = Number(count ?? 0);
  return total === 1 ? "1 comentário" : `${total} comentários`;
}

export function renderCommentBody(comment = {}) {
  const text = String(comment.text || "");
  const mentions = Array.isArray(comment.mentions) ? comment.mentions : [];

  if (!mentions.length) {
    return escapeHtml(text);
  }

  const tokens = mentions
    .map((mention) => ({
      token: `@${String(mention.displayName || "")}`,
      displayName: String(mention.displayName || "")
    }))
    .filter((item) => item.displayName)
    .sort((left, right) => right.token.length - left.token.length);

  let parts = [{ type: "text", value: text }];

  for (const { token, displayName } of tokens) {
    const next = [];
    for (const part of parts) {
      if (part.type !== "text") {
        next.push(part);
        continue;
      }

      const segments = part.value.split(token);
      segments.forEach((segment, index) => {
        if (segment) {
          next.push({ type: "text", value: segment });
        }
        if (index < segments.length - 1) {
          next.push({ type: "mention", displayName });
        }
      });
    }
    parts = next;
  }

  return parts.map((part) => (
    part.type === "mention"
      ? `<span class="post-comment-mention">@${escapeHtml(part.displayName)}</span>`
      : escapeHtml(part.value)
  )).join("");
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
        <div class="post-comment-composer__field">
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
          <div class="post-comment-mention-dropdown" hidden role="listbox" aria-label="Sugestões de menção"></div>
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

function getComposerState(form) {
  if (!composerState.has(form)) {
    composerState.set(form, {
      mentionedUserIds: new Set(),
      activeIndex: -1,
      suggestions: []
    });
  }
  return composerState.get(form);
}

function getActiveMentionQuery(textarea) {
  const value = textarea.value;
  const cursor = textarea.selectionStart ?? value.length;
  const before = value.slice(0, cursor);
  const atIndex = before.lastIndexOf("@");

  if (atIndex === -1) {
    return null;
  }

  if (atIndex > 0) {
    const charBefore = before[atIndex - 1];
    if (charBefore !== " " && charBefore !== "\n" && charBefore !== "\t") {
      return null;
    }
  }

  const fragment = before.slice(atIndex + 1);
  if (fragment.includes("\n")) {
    return null;
  }

  if (fragment.length > 80) {
    return null;
  }

  if (fragment.endsWith(" ") && fragment.trim().includes(" ")) {
    return null;
  }

  return { query: fragment, start: atIndex, end: cursor };
}

function showMentionHint(form) {
  const dropdown = form.querySelector(".post-comment-mention-dropdown");
  if (!dropdown) {
    return;
  }

  dropdown.hidden = false;
  dropdown.innerHTML = `
    <p class="post-comment-mention-hint">Digite o nome do colaborador para buscar</p>
  `;
}

function syncMentionState(form, textarea) {
  const active = getActiveMentionQuery(textarea);
  if (!active) {
    hideMentionDropdown(form);
    return;
  }

  if (!active.query) {
    showMentionHint(form);
    return;
  }

  scheduleMentionSuggestions(form, active.query);
}

function hideMentionDropdown(form) {
  const dropdown = form.querySelector(".post-comment-mention-dropdown");
  if (dropdown) {
    dropdown.hidden = true;
    dropdown.innerHTML = "";
  }
  const state = getComposerState(form);
  state.activeIndex = -1;
  state.suggestions = [];
}

function renderMentionDropdown(form, suggestions, activeIndex) {
  const dropdown = form.querySelector(".post-comment-mention-dropdown");
  if (!dropdown) {
    return;
  }

  if (!suggestions.length) {
    dropdown.hidden = true;
    dropdown.innerHTML = "";
    return;
  }

  dropdown.hidden = false;
  dropdown.innerHTML = suggestions.map((item, index) => `
    <button
      type="button"
      class="post-comment-mention-option ${index === activeIndex ? "is-active" : ""}"
      data-action="pick-feed-mention"
      data-user-id="${escapeHtml(item.userId)}"
      data-display-name="${escapeHtml(item.displayName)}"
      role="option"
      aria-selected="${index === activeIndex ? "true" : "false"}"
    >
      <span class="post-comment-mention-option__name">${escapeHtml(item.displayName)}</span>
      <span class="post-comment-mention-option__meta">${escapeHtml(item.department || "Companhia")}</span>
    </button>
  `).join("");
}

async function loadMentionSuggestions(form, query) {
  const normalized = String(query || "").trim();
  if (!normalized) {
    showMentionHint(form);
    return;
  }

  try {
    const payload = await suggestFeedMentions(normalized, { headers: getPortalAuthHeaders() });
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const state = getComposerState(form);
    state.suggestions = items.map((item) => ({
      userId: String(item.userId || item.user_id || ""),
      displayName: String(item.displayName || item.display_name || ""),
      department: String(item.department || "Companhia")
    })).filter((item) => item.userId && item.displayName);
    state.activeIndex = state.suggestions.length ? 0 : -1;
    renderMentionDropdown(form, state.suggestions, state.activeIndex);
  } catch (error) {
    console.error("Falha ao sugerir mencoes.", error);
    hideMentionDropdown(form);
  }
}

function scheduleMentionSuggestions(form, query) {
  const existing = suggestTimers.get(form);
  if (existing) {
    clearTimeout(existing);
  }

  suggestTimers.set(form, setTimeout(() => {
    loadMentionSuggestions(form, query);
  }, 180));
}

function applyMentionSelection(form, textarea, suggestion) {
  const active = getActiveMentionQuery(textarea);
  if (!active || !suggestion?.displayName) {
    return;
  }

  const mentionText = `@${suggestion.displayName} `;
  const nextValue = `${textarea.value.slice(0, active.start)}${mentionText}${textarea.value.slice(active.end)}`;
  textarea.value = nextValue;

  const state = getComposerState(form);
  state.mentionedUserIds.add(suggestion.userId);

  const nextCursor = active.start + mentionText.length;
  textarea.setSelectionRange(nextCursor, nextCursor);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  hideMentionDropdown(form);
  textarea.focus();
}

function pickActiveSuggestion(form, textarea) {
  const state = getComposerState(form);
  if (!state.suggestions.length || state.activeIndex < 0) {
    return false;
  }

  applyMentionSelection(form, textarea, state.suggestions[state.activeIndex]);
  return true;
}

function moveMentionSelection(form, delta) {
  const state = getComposerState(form);
  if (!state.suggestions.length) {
    return;
  }

  const total = state.suggestions.length;
  state.activeIndex = (state.activeIndex + delta + total) % total;
  renderMentionDropdown(form, state.suggestions, state.activeIndex);
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
  const state = getComposerState(form);

  if (textarea) {
    textarea.value = "";
    resizeTextarea(textarea);
  }

  state.mentionedUserIds.clear();
  hideMentionDropdown(form);

  if (submitButton) {
    submitButton.disabled = true;
  }
}

function bindComposerForm(form) {
  const textarea = form.querySelector(".post-comment-input");
  const submitButton = form.querySelector(".post-comment-submit");
  if (!textarea || !submitButton) {
    return;
  }

  resizeTextarea(textarea);

  const handleMentionSync = () => {
    resizeTextarea(textarea);
    submitButton.disabled = !textarea.value.trim();
    syncMentionState(form, textarea);
  };

  textarea.addEventListener("input", handleMentionSync);
  textarea.addEventListener("keyup", handleMentionSync);
  textarea.addEventListener("click", handleMentionSync);

  textarea.addEventListener("keydown", (event) => {
    const state = getComposerState(form);
    const dropdownOpen = Boolean(form.querySelector(".post-comment-mention-dropdown:not([hidden])"));

    if (dropdownOpen && event.key === "ArrowDown") {
      event.preventDefault();
      moveMentionSelection(form, 1);
      return;
    }

    if (dropdownOpen && event.key === "ArrowUp") {
      event.preventDefault();
      moveMentionSelection(form, -1);
      return;
    }

    if (dropdownOpen && (event.key === "Enter" || event.key === "Tab") && state.suggestions.length) {
      event.preventDefault();
      pickActiveSuggestion(form, textarea);
      return;
    }

    if (event.key === "Escape") {
      hideMentionDropdown(form);
      return;
    }

    if (event.key === "@" || event.key.length === 1) {
      queueMicrotask(() => syncMentionState(form, textarea));
    }
  });

  form.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action='pick-feed-mention']");
    if (!target) {
      return;
    }

    event.preventDefault();
    applyMentionSelection(form, textarea, {
      userId: target.getAttribute("data-user-id") || "",
      displayName: target.getAttribute("data-display-name") || ""
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const postId = form.getAttribute("data-post-id") || "";
    const text = textarea.value.trim();
    if (!postId || !text) {
      return;
    }

    const state = getComposerState(form);
    submitButton.disabled = true;

    try {
      const comment = await createFeedPostComment(
        postId,
        {
          text,
          mentionedUserIds: Array.from(state.mentionedUserIds)
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
