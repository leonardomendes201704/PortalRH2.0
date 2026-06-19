import { escapeHtml } from "./html.js";

export function renderHeaderShell(data) {
  return `
    <header class="topbar" aria-label="Barra superior">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true"></div>
        <div class="brand-copy">
          <strong>${escapeHtml(data.brand.name)}</strong>
          <span>${escapeHtml(data.brand.tagline)}</span>
        </div>
      </div>

      <div class="topbar-actions">
        <div class="user-chip">
          <div class="avatar" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
          <div class="user-info">
            <strong>${escapeHtml(data.user.name)}</strong>
            ${data.user.area ? `<span class="user-area">${escapeHtml(data.user.area)}</span>` : ""}
          </div>
        </div>
        <button class="topbar-link" data-analytics="topbar.profile">Meu Perfil ▼</button>
        <button class="topbar-link notif" data-analytics="topbar.notifications" data-count="${escapeHtml(String(data.user.notificationCount ?? 0))}">Notificações</button>
        <button class="topbar-link" data-analytics="topbar.logout" data-action="portal-logout">Sair</button>
      </div>
    </header>

    <nav class="nav" aria-label="Menu principal">
      <div class="nav-tabs">
        ${data.navItems.map((item) => `
          <a
            href="${escapeHtml(item.href || "#")}"
            class="${item.active ? "active" : ""}"
            data-analytics="nav.tab"
            data-analytics-label="${escapeHtml(item.label)}"
            aria-current="${item.active ? "page" : "false"}"
          >${escapeHtml(item.label)}</a>
        `).join("")}
      </div>
    </nav>
  `;
}
