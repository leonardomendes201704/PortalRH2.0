import { escapeHtml } from "./html.js";
import { suggestFeedMentions } from "../services/feedService.js?v=0.21.3";
import { getPortalAuthHeaders } from "../services/portalAuthService.js?v=0.17.0";

const mentionState = new WeakMap();
const suggestTimers = new WeakMap();
const suggestControllers = new WeakMap();

const DROPDOWN_SELECTOR = ".feed-mention-dropdown";

export function renderMentionBody(content = {}) {
  const text = String(content.text ?? content ?? "");
  const mentions = Array.isArray(content.mentions) ? content.mentions : [];

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

function parseMentionSuggestions(payload = {}) {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.Items)
      ? payload.Items
      : [];

  return items.map((item) => ({
    userId: String(item.userId || item.UserId || item.user_id || ""),
    displayName: String(item.displayName || item.DisplayName || item.display_name || ""),
    department: String(item.department || item.Department || "Companhia")
  })).filter((item) => item.userId && item.displayName);
}

function getState(fieldRoot) {
  if (!mentionState.has(fieldRoot)) {
    mentionState.set(fieldRoot, {
      mentionedUserIds: new Set(),
      activeIndex: -1,
      suggestions: []
    });
  }
  return mentionState.get(fieldRoot);
}

function getDropdown(fieldRoot) {
  return fieldRoot.querySelector(DROPDOWN_SELECTOR);
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
  if (fragment.includes("\n") || fragment.length > 80) {
    return null;
  }

  if (fragment.endsWith(" ") && fragment.trim().includes(" ")) {
    return null;
  }

  return { query: fragment, start: atIndex, end: cursor };
}

function showMentionHint(fieldRoot) {
  const dropdown = getDropdown(fieldRoot);
  if (!dropdown) {
    return;
  }

  dropdown.hidden = false;
  dropdown.innerHTML = `<p class="post-comment-mention-hint">Digite o nome do colaborador para buscar</p>`;
}

function hideMentionDropdown(fieldRoot) {
  const dropdown = getDropdown(fieldRoot);
  if (dropdown) {
    dropdown.hidden = true;
    dropdown.innerHTML = "";
  }

  const state = getState(fieldRoot);
  state.activeIndex = -1;
  state.suggestions = [];
}

function renderMentionDropdown(fieldRoot, suggestions, activeIndex, { message = "" } = {}) {
  const dropdown = getDropdown(fieldRoot);
  if (!dropdown) {
    return;
  }

  if (message) {
    dropdown.hidden = false;
    dropdown.innerHTML = `<p class="post-comment-mention-hint">${escapeHtml(message)}</p>`;
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

async function loadMentionSuggestions(fieldRoot, textarea, query) {
  const normalized = String(query || "").trim();
  if (!normalized) {
    showMentionHint(fieldRoot);
    return;
  }

  const existingController = suggestControllers.get(fieldRoot);
  if (existingController) {
    existingController.abort();
  }

  const controller = new AbortController();
  suggestControllers.set(fieldRoot, controller);
  renderMentionDropdown(fieldRoot, [], -1, { message: "Buscando colaboradores..." });

  try {
    const payload = await suggestFeedMentions(normalized, {
      headers: getPortalAuthHeaders(),
      signal: controller.signal
    });

    if (controller.signal.aborted) {
      return;
    }

    const active = getActiveMentionQuery(textarea);
    if (!active || active.query.trim().toLowerCase() !== normalized.toLowerCase()) {
      return;
    }

    const state = getState(fieldRoot);
    state.suggestions = parseMentionSuggestions(payload);
    state.activeIndex = state.suggestions.length ? 0 : -1;

    if (!state.suggestions.length) {
      renderMentionDropdown(fieldRoot, [], -1, { message: "Nenhum colaborador encontrado." });
      return;
    }

    renderMentionDropdown(fieldRoot, state.suggestions, state.activeIndex);
  } catch (error) {
    if (controller.signal.aborted || error?.name === "AbortError") {
      return;
    }

    console.error("Falha ao sugerir mencoes.", error);
    renderMentionDropdown(fieldRoot, [], -1, { message: "Nao foi possivel buscar colaboradores agora." });
  } finally {
    if (suggestControllers.get(fieldRoot) === controller) {
      suggestControllers.delete(fieldRoot);
    }
  }
}

function scheduleMentionSuggestions(fieldRoot, textarea, query) {
  const existing = suggestTimers.get(fieldRoot);
  if (existing) {
    clearTimeout(existing);
  }

  suggestTimers.set(fieldRoot, setTimeout(() => {
    loadMentionSuggestions(fieldRoot, textarea, query);
  }, 120));
}

function syncMentionState(fieldRoot, textarea) {
  const active = getActiveMentionQuery(textarea);
  if (!active) {
    hideMentionDropdown(fieldRoot);
    return;
  }

  if (!active.query) {
    showMentionHint(fieldRoot);
    return;
  }

  scheduleMentionSuggestions(fieldRoot, textarea, active.query);
}

function applyMentionSelection(fieldRoot, textarea, suggestion) {
  const active = getActiveMentionQuery(textarea);
  if (!active || !suggestion?.displayName) {
    return;
  }

  const mentionText = `@${suggestion.displayName} `;
  textarea.value = `${textarea.value.slice(0, active.start)}${mentionText}${textarea.value.slice(active.end)}`;

  const state = getState(fieldRoot);
  state.mentionedUserIds.add(suggestion.userId);

  const nextCursor = active.start + mentionText.length;
  textarea.setSelectionRange(nextCursor, nextCursor);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  hideMentionDropdown(fieldRoot);
  textarea.focus();
}

function pickActiveSuggestion(fieldRoot, textarea) {
  const state = getState(fieldRoot);
  if (!state.suggestions.length || state.activeIndex < 0) {
    return false;
  }

  applyMentionSelection(fieldRoot, textarea, state.suggestions[state.activeIndex]);
  return true;
}

function moveMentionSelection(fieldRoot, delta) {
  const state = getState(fieldRoot);
  if (!state.suggestions.length) {
    return;
  }

  const total = state.suggestions.length;
  state.activeIndex = (state.activeIndex + delta + total) % total;
  renderMentionDropdown(fieldRoot, state.suggestions, state.activeIndex);
}

export function bindMentionField({ fieldRoot, textarea, onSync }) {
  if (!fieldRoot || !textarea || fieldRoot.dataset.mentionBound === "true") {
    return {
      getMentionedUserIds: () => [],
      resetMentions: () => {}
    };
  }

  fieldRoot.dataset.mentionBound = "true";

  const runSync = () => {
    requestAnimationFrame(() => {
      onSync?.();
      syncMentionState(fieldRoot, textarea);
    });
  };

  textarea.addEventListener("input", runSync);
  textarea.addEventListener("keyup", runSync);
  textarea.addEventListener("click", runSync);

  textarea.addEventListener("keydown", (event) => {
    const state = getState(fieldRoot);
    const dropdownOpen = Boolean(getDropdown(fieldRoot) && !getDropdown(fieldRoot).hidden);

    if (dropdownOpen && event.key === "ArrowDown") {
      event.preventDefault();
      moveMentionSelection(fieldRoot, 1);
      return;
    }

    if (dropdownOpen && event.key === "ArrowUp") {
      event.preventDefault();
      moveMentionSelection(fieldRoot, -1);
      return;
    }

    if (dropdownOpen && (event.key === "Enter" || event.key === "Tab") && state.suggestions.length) {
      event.preventDefault();
      pickActiveSuggestion(fieldRoot, textarea);
      return;
    }

    if (event.key === "Escape") {
      hideMentionDropdown(fieldRoot);
      return;
    }

    if (event.key === "@" || event.key.length === 1) {
      queueMicrotask(() => syncMentionState(fieldRoot, textarea));
    }
  });

  fieldRoot.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action='pick-feed-mention']");
    if (!target) {
      return;
    }

    event.preventDefault();
    applyMentionSelection(fieldRoot, textarea, {
      userId: target.getAttribute("data-user-id") || "",
      displayName: target.getAttribute("data-display-name") || ""
    });
  });

  return {
    getMentionedUserIds: () => Array.from(getState(fieldRoot).mentionedUserIds),
    resetMentions: () => {
      getState(fieldRoot).mentionedUserIds.clear();
      hideMentionDropdown(fieldRoot);
    }
  };
}

export function renderMentionDropdownMarkup() {
  return `<div class="feed-mention-dropdown post-comment-mention-dropdown" hidden role="listbox" aria-label="Sugestoes de mencao"></div>`;
}
