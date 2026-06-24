import { renderEmptyState } from "./cards.js";
import { escapeHtml } from "./html.js";

const NOTIFICATION_ICONS = {
  "Notificações Totais": "fa-solid fa-bell",
  "Comunicados RH": "fa-solid fa-bullhorn",
  "Comunicados Corporativos": "fa-solid fa-building",
  "Tecnologia": "fa-solid fa-microchip",
  "Politicas": "fa-solid fa-scale-balanced",
  "Políticas": "fa-solid fa-scale-balanced",
  "Eventos": "fa-solid fa-calendar-days",
  "Enquetes": "fa-solid fa-square-poll-vertical",
  "Lidas": "fa-solid fa-check-double",
  "Notificações Totais": "fa-solid fa-bell",
  "Comunicados Novos": "fa-solid fa-bullhorn",
  "Interações no Feed": "fa-solid fa-comments",
  "Aprovações Pendentes": "fa-solid fa-circle-check",
  "Eventos/Reuniões": "fa-solid fa-calendar-days",
  "Aniversários": "fa-solid fa-cake-candles",
  "Atualizações de Sistema": "fa-solid fa-gear"
};

const PROFILE_ICONS = {
  "Férias (Consultar/Solicitar)": "fa-solid fa-umbrella-beach",
  "Holerite (Maio 2024)": "fa-solid fa-file-invoice-dollar",
  "Benefícios (Seguro/VT)": "fa-solid fa-heart-pulse",
  "Minha Avaliação": "fa-solid fa-star",
  "Dados Cadastrais": "fa-solid fa-id-card",
  Ponto: "fa-solid fa-clock",
  Treinamentos: "fa-solid fa-graduation-cap",
  "Chamados RH": "fa-solid fa-headset"
};

function renderPanelPill(label, tone = "neutral") {
  return `<span class="panel-pill panel-pill--${tone}">${escapeHtml(label)}</span>`;
}

export function renderMenuCard(panel) {
  const items = Array.isArray(panel.items) ? panel.items : [];

  return `
    <section class="card">
      <div class="card-header">${escapeHtml(panel.title)}</div>
      ${items.length ? `
        <div class="menu-list">
          ${items.map((item) => `
            <div class="menu-item">
              <span>${escapeHtml(item.label)}</span>
              ${item.badge ? `<span class="menu-badge">${escapeHtml(item.badge)}</span>` : ""}
              ${item.value ? `<strong>${escapeHtml(item.value)}</strong>` : ""}
            </div>
          `).join("")}
        </div>
      ` : renderEmptyState("Sem itens por enquanto", "Este painel será preenchido quando os dados do módulo estiverem disponíveis.")}
    </section>
  `;
}

export function renderNotificationsCard(panel) {
  const panelItems = Array.isArray(panel.items) ? panel.items : [];
  const [totalItem, ...items] = panelItems;
  const total = totalItem?.badge || totalItem?.value || "0";

  return `
    <section class="card notifications-card">
      <div class="card-header">${escapeHtml(panel.title)}</div>
      <div class="notifications-summary">
        <div class="notifications-total">
          <span class="notifications-total-icon" aria-hidden="true"><i class="fa-solid fa-bell"></i></span>
          <div>
            <strong>${escapeHtml(total)}</strong>
            <span>${escapeHtml(totalItem?.label || "Notificações")}</span>
          </div>
        </div>
        <div class="notifications-pills">
          ${items.slice(0, 3).map((item) => renderPanelPill(item.label, "info")).join("")}
        </div>
      </div>
      <div class="notification-list">
        ${items.length ? items.map((item) => `
          <div class="notification-item">
            <span class="notification-icon" aria-hidden="true">
              <i class="${escapeHtml(NOTIFICATION_ICONS[item.label] || "fa-solid fa-circle")}" aria-hidden="true"></i>
            </span>
            <span class="notification-label">${escapeHtml(item.label)}</span>
            ${item.badge ? `<span class="notification-badge">${escapeHtml(item.badge)}</span>` : ""}
          </div>
        `).join("") : renderEmptyState("Nenhuma notificação", "Quando houver alertas do dia, eles aparecerão aqui.")}
      </div>
    </section>
  `;
}

export function renderQuickLinksCard(panel) {
  const items = Array.isArray(panel.items) ? panel.items : [];

  return `
    <section class="card quick-links-card">
      <div class="card-header">${escapeHtml(panel.title)}</div>
      ${items.length ? `
        <div class="quick-grid">
          ${items.map((item) => `
            <a
              class="quick-item ${escapeHtml(item.className)}"
              href="#"
              data-analytics="quick-link.open"
              data-analytics-label="${escapeHtml(item.label)}"
              aria-label="${escapeHtml(item.label)}"
            >
              <div class="quick-item-content">
                <strong class="quick-item-mark">${escapeHtml(item.shortLabel)}</strong>
                <span class="quick-item-label">${escapeHtml(item.label)}</span>
              </div>
            </a>
          `).join("")}
        </div>
      ` : renderEmptyState("Sem atalhos configurados", "Os serviços rápidos serão exibidos aqui quando o catálogo estiver disponível.")}
    </section>
  `;
}

export function renderProfileCard(panel) {
  const items = Array.isArray(panel.items) ? panel.items : [];

  return `
    <section class="card profile-card">
      <div class="card-header">${escapeHtml(panel.title)}</div>
      <div class="profile-box">
        <div class="profile-head">
          <div class="avatar" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
          <div class="profile-head-copy">
            <div class="profile-name">${escapeHtml(panel.name)}</div>
            ${panel.subtitle ? `<div class="user-area">${escapeHtml(panel.subtitle)}</div>` : ""}
            ${panel.description ? `<div class="profile-role">${escapeHtml(panel.description)}</div>` : ""}
            ${panel.manager ? `<div class="profile-role">Gestor: ${escapeHtml(panel.manager)}</div>` : ""}
            <div class="profile-meta">
              ${renderPanelPill("RH", "brand")}
              ${renderPanelPill("Perfil ativo", "success")}
            </div>
          </div>
        </div>
        <div class="profile-links">
          ${items.length ? items.map((item) => `
            <div class="profile-link-row">
              <span class="profile-link-icon" aria-hidden="true">
                <i class="${escapeHtml(PROFILE_ICONS[item] || "fa-solid fa-angle-right")}"></i>
              </span>
              <span>${escapeHtml(item)}</span>
            </div>
          `).join("") : renderEmptyState("Perfil sem serviços", "Os atalhos de RH deste colaborador serão exibidos aqui.")}
        </div>
      </div>
    </section>
  `;
}

export function renderAgendaCard(panel) {
  const items = Array.isArray(panel.items) ? panel.items : [];

  return `
    <section class="card agenda-card">
      <div class="card-header">${escapeHtml(panel.title)}</div>
      <div class="agenda-list">
        ${items.length ? items.map((item) => {
          const raw = typeof item === "string" ? item : item.label;
          const [time, ...titleParts] = String(raw).split("•");
          const title = titleParts.join("•").trim() || String(raw).trim();

          return `
            <div class="agenda-item">
              <div class="agenda-time">${escapeHtml(time.trim())}</div>
              <div class="agenda-dot" aria-hidden="true"></div>
              <div class="agenda-copy">
                <strong>${escapeHtml(title)}</strong>
                <span>Compromisso corporativo</span>
              </div>
            </div>
          `;
        }).join("") : renderEmptyState("Agenda livre", "Nenhum compromisso programado para hoje.")}
      </div>
    </section>
  `;
}

export function renderSidebarPanels(panels) {
  return panels.map((panel) => {
    if (panel.type === "quick-links") {
      return renderQuickLinksCard(panel);
    }

    if (panel.type === "profile") {
      return renderProfileCard(panel);
    }

    if (panel.title === "MEU PAINEL") {
      return renderNotificationsCard(panel);
    }

    if (panel.title === "AGENDA DO DIA") {
      return renderAgendaCard(panel);
    }

    return renderMenuCard(panel);
  }).join("");
}
