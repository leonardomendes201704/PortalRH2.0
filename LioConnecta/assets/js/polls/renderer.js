import { renderEmptyState } from "../components/cards.js";
import { escapeHtml } from "../components/html.js";

function renderPollAttachment(poll, className = "") {
  if (!poll?.attachmentUrl || !poll?.attachmentLabel) {
    return "";
  }

  const classes = ["comm-inline-action", className].filter(Boolean).join(" ");

  return `
    <a href="${escapeHtml(poll.attachmentUrl)}" class="${classes}" target="_blank" rel="noreferrer noopener">
      <i class="fa-solid fa-paperclip"></i>
      ${escapeHtml(poll.attachmentLabel)}
    </a>
  `;
}

function renderPollMedia(poll, { compact = false, cover = false } = {}) {
  if (!poll?.imageUrl) {
    return "";
  }

  const modifier = [
    "poll-media",
    compact ? "is-compact" : "",
    cover ? "is-cover" : ""
  ].filter(Boolean).join(" ");

  return `
    <div class="${modifier}">
      <img src="${escapeHtml(poll.imageUrl)}" alt="${escapeHtml(poll.title || "Imagem da enquete")}" loading="lazy" />
    </div>
  `;
}

function renderPollAssetUploader({
  assetType,
  label,
  inputName,
  valueName,
  value,
  accept,
  buttonLabel,
  helper,
  previewType
}) {
  const hasValue = Boolean(value);
  const preview = previewType === "image" && hasValue
    ? `
      <div class="poll-asset-preview poll-asset-preview--image">
        <img src="${escapeHtml(value)}" alt="${escapeHtml(label)}" loading="lazy" />
      </div>
    `
    : hasValue
      ? `<div class="poll-asset-preview"><i class="fa-solid fa-paperclip"></i><span>${escapeHtml(value)}</span></div>`
      : `<div class="poll-asset-preview is-empty">Nenhum arquivo enviado ainda.</div>`;

  return `
    <div class="communication-form-field communication-form-field--full poll-asset-field" data-poll-asset="${escapeHtml(assetType)}">
      <span>${escapeHtml(label)}</span>
      <input type="hidden" name="${escapeHtml(valueName)}" value="${escapeHtml(value || "")}" />
      <div class="poll-asset-field__controls">
        <input type="file" name="${escapeHtml(inputName)}" accept="${escapeHtml(accept)}" />
        <button type="button" class="comm-secondary-button" data-action="upload-poll-asset" data-asset-type="${escapeHtml(assetType)}">
          ${escapeHtml(buttonLabel)}
        </button>
      </div>
      <small>${escapeHtml(helper)}</small>
      ${preview}
    </div>
  `;
}

function renderPollStatsCard(label, value, detail, tone = "brand") {
  return `
    <article class="comm-kpi comm-kpi--${escapeHtml(tone)}">
      <span class="comm-kpi-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <span class="comm-kpi-detail">${escapeHtml(detail)}</span>
    </article>
  `;
}

function renderPollOptionBar(option, showResults = false) {
  const extra = showResults
    ? `<span class="poll-option-result">${escapeHtml(String(option.votes))} voto(s) • ${escapeHtml(String(option.percentage))}%</span>`
    : `<span class="poll-option-result">${option.isSelected ? "Seu voto" : "Escolha disponivel"}</span>`;

  return `
    <div class="poll-option-bar ${option.isSelected ? "is-selected" : ""}">
      <div class="poll-option-bar__top">
        <strong>${escapeHtml(option.label)}</strong>
        ${extra}
      </div>
      <div class="poll-option-bar__track">
        <span style="width:${showResults ? Math.min(option.percentage, 100) : 0}%"></span>
      </div>
    </div>
  `;
}

function renderPollVoteInput(poll, option, index) {
  const type = poll.allowMultipleChoices ? "checkbox" : "radio";

  return `
    <label class="poll-vote-choice ${option.isSelected ? "is-selected" : ""}">
      <input
        type="${type}"
        name="poll-choice-${escapeHtml(poll.id)}"
        value="${escapeHtml(option.id)}"
        ${option.isSelected ? "checked" : ""}
      />
      <span>${escapeHtml(option.label)}</span>
    </label>
  `;
}

function renderPollMeta(poll) {
  return `
    <div class="poll-meta-row">
      <span><i class="fa-regular fa-calendar"></i>${escapeHtml(poll.publishedAtLabel || "A publicar")}</span>
      <span><i class="fa-solid fa-users"></i>${escapeHtml(poll.audience)}</span>
      <span><i class="fa-solid fa-chart-simple"></i>${escapeHtml(String(poll.totalVotes))} voto(s)</span>
      <span><i class="fa-solid fa-clock"></i>${escapeHtml(poll.statusLabel)}</span>
    </div>
  `;
}

function renderPollVoteForm(poll, compact = false) {
  return `
    <form class="poll-vote-form" data-action="submit-poll-vote" data-poll-id="${escapeHtml(poll.id)}">
      <div class="poll-vote-options ${compact ? "is-compact" : ""}">
        ${poll.options.map(renderPollVoteInput.bind(null, poll)).join("")}
      </div>
      <div class="poll-vote-actions">
        <button type="submit" class="feed-composer-submit">Registrar voto</button>
        ${poll.allowMultipleChoices
          ? '<span class="poll-form-hint">Voce pode selecionar mais de uma opcao.</span>'
          : '<span class="poll-form-hint">Escolha apenas uma alternativa.</span>'}
      </div>
    </form>
  `;
}

function renderPollResults(poll) {
  return `
    <div class="poll-results-list">
      ${poll.options.map((option) => renderPollOptionBar(option, true)).join("")}
    </div>
  `;
}

function renderPollCard(poll) {
  const footer = poll.status === "Published" && !poll.hasVoted
    ? renderPollVoteForm(poll, true)
    : poll.resultsVisible
      ? renderPollResults(poll)
      : `<div class="poll-results-locked"><i class="fa-solid fa-lock"></i><span>Os resultados serao exibidos ${escapeHtml(poll.resultsVisibilityLabel.toLowerCase())}.</span></div>`;

  return `
    <article class="card poll-card">
      <div class="poll-card__top">
        <div class="comm-meta-row">
          <span class="comm-tag comm-tag--solid">${escapeHtml(poll.statusLabel)}</span>
          ${poll.allowMultipleChoices ? '<span class="comm-tag">Multipla escolha</span>' : '<span class="comm-tag">Escolha unica</span>'}
        </div>
        ${poll.isFeatured ? '<span class="comm-status">Destaque</span>' : ""}
      </div>
      ${renderPollMedia(poll, { compact: true })}
      <h3>${escapeHtml(poll.title)}</h3>
      <p>${escapeHtml(poll.summary)}</p>
      ${renderPollMeta(poll)}
      <div class="poll-card__actions">
        <a href="#enquetes/leitura/${escapeHtml(poll.slug)}" class="comm-inline-action">Abrir enquete</a>
        ${renderPollAttachment(poll)}
      </div>
      ${footer}
    </article>
  `;
}

function renderPollHero(data, canManage = false) {
  return `
    <section class="card comm-hero-card poll-hero-card">
      <div class="comm-hero-copy comm-hero-copy--solid">
        <span class="comm-hero-eyebrow">${escapeHtml(data.intro.eyebrow)}</span>
        <h1>${escapeHtml(data.intro.title)}</h1>
        <p>${escapeHtml(data.intro.subtitle)}</p>
        ${canManage ? `
          <div class="poll-hero-actions">
            <a href="#admin/enquetes" class="feed-composer-submit">Gerenciar enquetes</a>
          </div>
        ` : ""}
      </div>
    </section>
  `;
}

export function renderHomePollHighlight(poll) {
  if (!poll) {
    return "";
  }

  return `
    <section class="card poll-home-card">
      <div class="card-header">ENQUETE DA SEMANA</div>
      <div class="poll-home-card__body">
        <div class="poll-home-card__copy">
          <div class="comm-meta-row">
            <span class="comm-tag comm-tag--solid">${escapeHtml(poll.statusLabel)}</span>
            <span class="comm-tag">${escapeHtml(String(poll.totalVotes))} voto(s)</span>
          </div>
          <h3>${escapeHtml(poll.title)}</h3>
          <p>${escapeHtml(poll.summary)}</p>
          <div class="poll-home-card__actions">
            <a href="#enquetes/leitura/${escapeHtml(poll.slug)}" class="feed-composer-submit">Responder agora</a>
            ${renderPollAttachment(poll)}
          </div>
        </div>
        ${renderPollMedia(poll, { cover: true })}
      </div>
    </section>
  `;
}

export function renderPollsHub(data, { canManage = false } = {}) {
  const featuredBlock = data.featured
    ? `
      <section class="card poll-featured-card">
        <div class="card-header">Enquete em destaque</div>
        <div class="poll-featured-card__body">
          <div class="poll-featured-card__copy">
            <div class="comm-meta-row">
              <span class="comm-tag comm-tag--solid">${escapeHtml(data.featured.statusLabel)}</span>
              <span class="comm-tag">${data.featured.allowMultipleChoices ? "Multipla escolha" : "Escolha unica"}</span>
            </div>
            <h2>${escapeHtml(data.featured.title)}</h2>
            <p>${escapeHtml(data.featured.body || data.featured.summary)}</p>
            ${renderPollMeta(data.featured)}
            ${renderPollAttachment(data.featured)}
          </div>
          <div class="poll-featured-card__vote">
            ${renderPollMedia(data.featured, { cover: true })}
            ${data.featured.status === "Published" && !data.featured.hasVoted
              ? renderPollVoteForm(data.featured)
              : data.featured.resultsVisible
                ? renderPollResults(data.featured)
                : `<div class="poll-results-locked"><i class="fa-solid fa-lock"></i><span>Resultados ocultos ate a proxima etapa desta enquete.</span></div>`}
          </div>
        </div>
      </section>
    `
    : `
      <section class="card">
        <div class="card-header">Enquetes em destaque</div>
        ${renderEmptyState("Nenhuma enquete publicada", "Assim que a primeira enquete for publicada, ela aparecera aqui para toda a companhia.")}
      </section>
    `;

  const listBlock = data.allPolls.length
    ? `<div class="poll-grid">${data.allPolls.map(renderPollCard).join("")}</div>`
    : renderEmptyState("Nenhuma enquete disponivel", data.intro.loadError || "Nao existem enquetes publicadas neste momento.");

  return [
    renderPollHero(data, canManage),
    `<section class="comm-kpi-grid">
      ${renderPollStatsCard("Enquetes publicadas", data.stats.total, "Disponiveis para a companhia", "brand")}
      ${renderPollStatsCard("Abertas agora", data.stats.open, "Recebendo votos", "success")}
      ${renderPollStatsCard("Encerradas", data.stats.closed, "Historico consolidado", "info")}
      ${renderPollStatsCard("Votos contabilizados", data.stats.votes, "Participacao registrada", "danger")}
    </section>`,
    featuredBlock,
    `<section class="card">
      <div class="card-header">Todas as enquetes</div>
      <div class="poll-list-section">${listBlock}</div>
    </section>`
  ].join("");
}

export function renderPollDetailPage(poll) {
  if (!poll) {
    return `
      <section class="card">
        <div class="card-header">Detalhe da enquete</div>
        ${renderEmptyState("Enquete nao encontrada", "A enquete solicitada nao esta disponivel ou foi removida do ciclo publico.")}
      </section>
    `;
  }

  return `
    <section class="card poll-detail-card">
      <div class="card-header">Leitura da enquete</div>
      <div class="poll-detail-card__body">
        <div class="comm-meta-row">
          <span class="comm-tag comm-tag--solid">${escapeHtml(poll.statusLabel)}</span>
          <span class="comm-tag">${poll.allowMultipleChoices ? "Multipla escolha" : "Escolha unica"}</span>
          <span class="comm-tag">${escapeHtml(poll.resultsVisibilityLabel)}</span>
        </div>
        <h1>${escapeHtml(poll.title)}</h1>
        <p class="poll-detail-card__summary">${escapeHtml(poll.summary)}</p>
        ${renderPollMedia(poll, { cover: true })}
        <div class="poll-detail-card__content">
          ${escapeHtml(poll.body).replace(/\n/g, "<br>")}
        </div>
        ${renderPollMeta(poll)}
        ${renderPollAttachment(poll)}
        ${poll.status === "Published" && !poll.hasVoted
          ? renderPollVoteForm(poll)
          : poll.resultsVisible
            ? renderPollResults(poll)
            : `<div class="poll-results-locked"><i class="fa-solid fa-lock"></i><span>Os resultados ainda nao podem ser exibidos.</span></div>`}
      </div>
    </section>
  `;
}

function renderAdminPollCard(item) {
  const nextAction = item.status === "Draft"
    ? { label: "Publicar", status: "Published" }
    : item.status === "Published"
      ? { label: "Encerrar", status: "Closed" }
      : item.status === "Closed"
        ? { label: "Arquivar", status: "Archived" }
        : null;

  return `
    <article class="poll-admin-card ${item.isFeatured ? "is-featured" : ""}">
      <div class="poll-admin-card__top">
        <div class="comm-meta-row">
          <span class="comm-tag comm-tag--solid">${escapeHtml(item.statusLabel)}</span>
          <span class="comm-tag">${escapeHtml(String(item.totalVotes))} voto(s)</span>
          <span class="comm-tag">${escapeHtml(String(item.uniqueVoters))} participante(s)</span>
        </div>
        ${item.isFeatured ? '<span class="comm-status">Home</span>' : ""}
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      ${renderPollMedia(item, { compact: true })}
      <div class="poll-meta-row">
        <span><i class="fa-regular fa-calendar"></i>${escapeHtml(item.publishedAtLabel || "Nao publicada")}</span>
        <span><i class="fa-regular fa-clock"></i>${escapeHtml(item.closesAtLabel || "Sem encerramento")}</span>
      </div>
      ${renderPollAttachment(item)}
      <div class="poll-admin-card__options">
        ${item.options.map((option) => `<span class="comm-tag">${escapeHtml(option.label)} • ${escapeHtml(String(option.votes))}</span>`).join("")}
      </div>
      <div class="poll-admin-card__actions">
        <button type="button" class="comm-inline-action" data-action="admin-poll-edit" data-poll-id="${escapeHtml(item.id)}">Editar</button>
        ${nextAction ? `
          <button
            type="button"
            class="comm-secondary-button"
            data-action="admin-poll-status"
            data-poll-id="${escapeHtml(item.id)}"
            data-next-status="${escapeHtml(nextAction.status)}"
          >
            ${escapeHtml(nextAction.label)}
          </button>
        ` : ""}
        <a href="#enquetes/leitura/${escapeHtml(item.slug)}" class="comm-tertiary-button">Ver publico</a>
      </div>
    </article>
  `;
}

function renderAdminOptionEditor(option = {}, index = 0) {
  return `
    <div class="poll-option-editor" data-option-row>
      <input type="hidden" name="optionId" value="${escapeHtml(option.id || "")}" />
      <label class="communication-form-field">
        <span>Opcao ${index + 1}</span>
        <input type="text" name="optionLabel" value="${escapeHtml(option.label || "")}" placeholder="Descreva a alternativa" />
      </label>
      <button type="button" class="comm-tertiary-button" data-action="remove-poll-option">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;
}

export function renderAdminPollsPage(data, selectedPoll = null) {
  const editing = Boolean(selectedPoll?.id);
  const formPoll = selectedPoll || {
    id: "",
    title: "",
    summary: "",
    body: "",
    imageUrl: "",
    attachmentLabel: "",
    attachmentUrl: "",
    audience: "Toda a companhia",
    status: "Draft",
    resultsVisibility: "AfterVote",
    allowMultipleChoices: false,
    isFeatured: false,
    publishedAtEditorValue: "",
    closesAtEditorValue: "",
    options: [{ id: "", label: "" }, { id: "", label: "" }]
  };

  return [
    renderPollHero(data, true),
    `<section class="comm-kpi-grid">
      ${renderPollStatsCard("Enquetes cadastradas", data.summary.totalPolls, "Base editorial", "brand")}
      ${renderPollStatsCard("Publicadas", data.summary.publishedPolls, "Disponiveis no portal", "success")}
      ${renderPollStatsCard("Encerradas", data.summary.closedPolls, "Historico consolidado", "info")}
      ${renderPollStatsCard("Votos acumulados", data.summary.totalVotes, "Participacao registrada", "danger")}
    </section>`,
    `<section class="poll-admin-layout">
      <div class="card">
        <div class="card-header">Enquetes publicadas e rascunhos</div>
        <div class="poll-admin-list">
          ${data.items.length ? data.items.map(renderAdminPollCard).join("") : renderEmptyState("Nenhuma enquete cadastrada", data.intro.loadError || "Crie a primeira enquete para iniciar o modulo editorial.")}
        </div>
      </div>
      <div class="card">
        <div class="card-header">${editing ? "Editar enquete" : "Nova enquete"}</div>
        <form id="admin-poll-form" class="poll-admin-form" data-mode="${editing ? "edit" : "create"}" data-poll-id="${escapeHtml(formPoll.id || "")}">
          <div class="communication-form-grid">
            <label class="communication-form-field communication-form-field--full">
              <span>Titulo</span>
              <input type="text" name="title" value="${escapeHtml(formPoll.title || "")}" placeholder="Qual pauta devemos priorizar?" />
            </label>
            <label class="communication-form-field communication-form-field--full">
              <span>Resumo</span>
              <textarea name="summary" rows="3" placeholder="Contextualize o objetivo da enquete">${escapeHtml(formPoll.summary || "")}</textarea>
            </label>
            <label class="communication-form-field communication-form-field--full">
              <span>Descricao completa</span>
              <textarea name="body" rows="6" placeholder="Explique o motivo, o criterio de escolha e o prazo da enquete">${escapeHtml(formPoll.body || "")}</textarea>
            </label>
            ${renderPollAssetUploader({
              assetType: "image",
              label: "Imagem da enquete",
              inputName: "pollImageFile",
              valueName: "imageUrl",
              value: formPoll.imageUrl || "",
              accept: "image/*",
              buttonLabel: "Enviar imagem",
              helper: "Use PNG, JPG, WEBP ou GIF.",
              previewType: "image"
            })}
            <label class="communication-form-field">
              <span>Rotulo do anexo</span>
              <input type="text" name="attachmentLabel" value="${escapeHtml(formPoll.attachmentLabel || "")}" placeholder="Baixar material complementar" />
            </label>
            ${renderPollAssetUploader({
              assetType: "attachment",
              label: "Arquivo anexo",
              inputName: "pollAttachmentFile",
              valueName: "attachmentUrl",
              value: formPoll.attachmentUrl || "",
              accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip",
              buttonLabel: "Enviar anexo",
              helper: "Use PDF, Office, TXT ou ZIP.",
              previewType: "attachment"
            })}
            <label class="communication-form-field">
              <span>Publico</span>
              <input type="text" name="audience" value="${escapeHtml(formPoll.audience || "Toda a companhia")}" />
            </label>
            <label class="communication-form-field">
              <span>Status</span>
              <select name="status">
                ${data.statusOptions.map((option) => `<option value="${escapeHtml(option.key)}" ${option.key === formPoll.status ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
              </select>
            </label>
            <label class="communication-form-field">
              <span>Publicacao</span>
              <input type="datetime-local" name="publishedAtUtc" value="${escapeHtml(formPoll.publishedAtEditorValue || "")}" />
            </label>
            <label class="communication-form-field">
              <span>Encerramento</span>
              <input type="datetime-local" name="closesAtUtc" value="${escapeHtml(formPoll.closesAtEditorValue || "")}" />
            </label>
            <label class="communication-form-field">
              <span>Visibilidade dos resultados</span>
              <select name="resultsVisibility">
                ${data.resultsVisibilityOptions.map((option) => `<option value="${escapeHtml(option.key)}" ${option.key === formPoll.resultsVisibility ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
              </select>
            </label>
            <div class="communication-form-field">
              <span>Preferencias</span>
              <label class="communication-checkbox-wrap"><input type="checkbox" name="allowMultipleChoices" ${formPoll.allowMultipleChoices ? "checked" : ""} /> Permitir multipla escolha</label>
              <label class="communication-checkbox-wrap"><input type="checkbox" name="isFeatured" ${formPoll.isFeatured ? "checked" : ""} /> Destacar na home</label>
            </div>
          </div>
          <div class="poll-admin-options-editor">
            <div class="poll-admin-options-editor__head">
              <strong>Alternativas da enquete</strong>
              <button type="button" class="comm-secondary-button" data-action="add-poll-option">Adicionar opcao</button>
            </div>
            <div id="poll-option-list">
              ${(formPoll.options || []).map(renderAdminOptionEditor).join("")}
            </div>
          </div>
          <div class="communication-form-actions communication-form-actions--spread">
            <div class="communication-form-footnote">
              O salvamento publica as opcoes exatamente na ordem exibida acima.
            </div>
            <div class="communication-form-action-group">
              <button type="submit" class="feed-composer-submit">${editing ? "Salvar alteracoes" : "Criar enquete"}</button>
              <button type="button" class="comm-tertiary-button" data-action="admin-poll-reset">Limpar</button>
            </div>
          </div>
        </form>
      </div>
    </section>`
  ].join("");
}
