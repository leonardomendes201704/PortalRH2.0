import { renderEmptyState } from "../components/cards.js";
import { initCarousel, renderCarouselSection } from "../components/carousel.js";
import { escapeHtml } from "../components/html.js";

function renderKpiCard(item) {
  return `
    <article class="comm-kpi comm-kpi--${escapeHtml(item.tone || "brand")}">
      <span class="comm-kpi-label">${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <span class="comm-kpi-detail">${escapeHtml(item.detail)}</span>
    </article>
  `;
}

function renderFilterChip(item) {
  return `
    <button
      type="button"
      class="comm-filter-chip ${item.active ? "is-active" : ""}"
      data-feedback-message="Filtro ${escapeHtml(item.label)} selecionado em modo demonstrativo."
      data-feedback-tone="info"
    >
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(String(item.count))}</strong>
    </button>
  `;
}

function renderReadLink(slug, label = "Ler comunicado", toneClass = "feed-composer-submit") {
  return `
    <a
      href="#comunicacao/leitura/${escapeHtml(slug)}"
      class="${toneClass}"
      data-analytics="communication.read"
      data-analytics-label="${escapeHtml(slug)}"
    >
      ${escapeHtml(label)}
    </a>
  `;
}

function renderCommunicationItem(item) {
  return `
    <article class="comm-item-card">
      <div class="comm-item-top">
        <div class="comm-meta-row">
          <span class="comm-tag comm-tag--solid">${escapeHtml(item.category)}</span>
          <span class="comm-tag">${escapeHtml(item.priority)}</span>
        </div>
        <span class="comm-status">${escapeHtml(item.status)}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <div class="comm-item-facts">
        <span><i class="fa-regular fa-calendar"></i>${escapeHtml(item.publishedAt)}</span>
        <span><i class="fa-solid fa-users"></i>${escapeHtml(item.audience)}</span>
        <span><i class="fa-solid fa-tower-broadcast"></i>${escapeHtml(item.channel)}</span>
      </div>
      <div class="comm-item-actions">
        ${renderReadLink(item.slug, "Ler comunicado", "comm-inline-action")}
        <button
          type="button"
          class="comm-inline-action"
          data-feedback-message="${escapeHtml(item.attachmentLabel)} iniciado em modo demonstrativo."
          data-feedback-tone="info"
        >
          ${escapeHtml(item.attachmentLabel)}
        </button>
      </div>
    </article>
  `;
}

function renderBodyParagraphs(body = []) {
  return body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function renderSelected(value, expected) {
  return value === expected ? "selected" : "";
}

function renderChecked(value) {
  return value ? "checked" : "";
}

export function renderCommunicationsHub(communications) {
  const hasItems = Array.isArray(communications.items) && communications.items.length > 0;

  return `
    <section class="card communications-hero-card">
      <div class="communications-hero">
        <div class="communications-hero-copy">
          <span class="communications-eyebrow">${escapeHtml(communications.intro.eyebrow)}</span>
          <h1>${escapeHtml(communications.intro.title)}</h1>
          <p>${escapeHtml(communications.intro.subtitle)}</p>
        </div>
      </div>
    </section>

    <section class="comm-kpi-grid">
      ${(communications.kpis || []).map(renderKpiCard).join("")}
    </section>

    <section class="card comm-filters-card">
      <div class="card-header">Navegue por categoria</div>
      <div class="comm-filter-list">
        ${(communications.filters || []).map(renderFilterChip).join("")}
      </div>
    </section>

    <section class="card comm-list-card">
      <div class="card-header">Todos os comunicados</div>
      <div class="comm-list-body">
        ${hasItems
          ? communications.items.map(renderCommunicationItem).join("")
          : communications.loadError
            ? renderEmptyState(
              "Não foi possível carregar os comunicados",
              communications.loadError
            )
            : renderEmptyState(
              "Nenhum comunicado publicado",
              "Quando o primeiro comunicado for persistido no banco, ele aparecerá nesta central."
            )}
      </div>
    </section>
  `;
}

export function renderCommunicationDetailPage(communication) {
  if (!communication) {
    return `
      <section class="card">
        <div class="card-header">Comunicado</div>
        ${renderEmptyState(
          "Comunicado nao encontrado",
          "O item solicitado nao esta disponivel ou ainda nao foi publicado na central oficial."
        )}
      </section>
    `;
  }

  return `
    <section class="card communication-detail-card">
      <div class="card-header">
        <a href="#comunicacao" class="comm-breadcrumb">Comunicacao</a>
        <span>/</span>
        <span>Leitura do comunicado</span>
      </div>
      <div class="communication-detail-body">
        <div class="comm-meta-row">
          <span class="comm-tag comm-tag--solid">${escapeHtml(communication.category)}</span>
          <span class="comm-tag">${escapeHtml(communication.priority)}</span>
          <span class="comm-status">${escapeHtml(communication.status)}</span>
        </div>

        <h1>${escapeHtml(communication.title)}</h1>

        <div class="communication-detail-facts">
          <span><i class="fa-regular fa-calendar"></i>${escapeHtml(communication.publishedAt)}</span>
          <span><i class="fa-solid fa-users"></i>${escapeHtml(communication.audience)}</span>
          <span><i class="fa-solid fa-tower-broadcast"></i>${escapeHtml(communication.channel)}</span>
        </div>

        ${communication.image ? `
          <div class="communication-detail-media">
            <img src="${escapeHtml(communication.image)}" alt="${escapeHtml(communication.imageAlt || communication.title)}">
          </div>
        ` : ""}

        <div class="communication-detail-summary">
          <strong>Resumo oficial</strong>
          <p>${escapeHtml(communication.summary)}</p>
        </div>

        <div class="communication-detail-content">
          ${renderBodyParagraphs(communication.body)}
        </div>

        <div class="communication-detail-actions">
          <a href="#comunicacao" class="comm-secondary-button">Voltar para central</a>
          <button
            type="button"
            class="feed-composer-submit"
            data-feedback-message="${escapeHtml(communication.attachmentLabel)} iniciado em modo demonstrativo."
            data-feedback-tone="info"
          >
            ${escapeHtml(communication.attachmentLabel)}
          </button>
        </div>
      </div>
    </section>
  `;
}

export function renderCommunicationAdminPage(communications, ldapSettings = {}) {
  const categoryOptions = (communications.availableCategories || [])
    .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
    .join("");

  const loginFormat = ldapSettings.loginFormat || "email-or-upn-or-samaccountname";
  const ldapLoadNotice = ldapSettings.loadError
    ? `<div class="communication-inline-notice communication-inline-notice--danger">${escapeHtml(ldapSettings.loadError)}</div>`
    : "";

  return `
    <section class="card communication-admin-hero-card">
      <div class="communication-admin-hero">
        <div class="communication-admin-copy">
          <span class="communications-eyebrow">AREA RESTRITA</span>
          <h1>Publicacao de comunicados oficiais</h1>
          <p>Ambiente editorial reservado para criacao, revisao e publicacao de comunicados institucionais.</p>
        </div>
        <div class="communication-admin-meta">
          <button type="button" class="comm-secondary-button" data-action="admin-logout">Sair da area admin</button>
        </div>
      </div>
    </section>

    <section class="communication-admin-layout">
      <div class="communication-admin-main">
        <section class="card communication-form-card">
          <div class="card-header">Novo comunicado</div>
          <form id="communication-admin-form">
          <div class="communication-form-grid">
            <label class="communication-form-field communication-form-field--full">
              <span>Titulo do comunicado</span>
              <input id="admin-title" name="title" type="text" value="Comunicado oficial sobre atualizacao de processo interno" />
            </label>

            <label class="communication-form-field">
              <span>Categoria</span>
              <select id="admin-category" name="category">
                <option>Selecionar categoria</option>
                ${categoryOptions}
              </select>
            </label>

            <label class="communication-form-field">
              <span>Prioridade</span>
              <select id="admin-priority" name="priority">
                <option>Alta prioridade</option>
                <option>Comunicado interno</option>
                <option>Programado</option>
                <option>Vigente</option>
              </select>
            </label>

            <label class="communication-form-field">
              <span>Audiencia</span>
              <select id="admin-audience" name="audience">
                <option>Toda a companhia</option>
                <option>Gestores e colaboradores</option>
                <option>Liderancas</option>
                <option>Publico interno</option>
              </select>
            </label>

            <label class="communication-form-field">
              <span>Canal de publicacao</span>
              <select id="admin-channel" name="channel">
                <option>Portal + email</option>
                <option>Portal</option>
                <option>Portal + Teams</option>
                <option>Portal + feed</option>
              </select>
            </label>

            <label class="communication-form-field communication-form-field--full">
              <span>Resumo oficial</span>
              <textarea id="admin-summary" name="summary" rows="4">Este comunicado consolida orientacoes institucionais, contexto executivo e impacto operacional esperado para as areas envolvidas.</textarea>
            </label>

            <label class="communication-form-field communication-form-field--full">
              <span>Corpo do comunicado</span>
              <textarea id="admin-body" name="body" rows="10">1. Contexto da publicacao.

2. Orientacoes detalhadas para liderancas e colaboradores.

3. Prazos, anexos e pontos de acompanhamento.

4. Canais oficiais para duvidas e suporte.</textarea>
            </label>

            <label class="communication-form-field">
              <span>Data de publicacao</span>
              <input id="admin-date" name="publishedAt" type="date" value="2026-06-19" />
            </label>

            <label class="communication-form-field">
              <span>Responsavel editorial</span>
              <input id="admin-owner" name="owner" type="text" value="Comunicacao Corporativa" />
            </label>

            <label class="communication-form-field">
              <span>Texto do anexo</span>
              <input id="admin-attachment" name="attachmentLabel" type="text" value="Baixar diretrizes" />
            </label>

            <label class="communication-form-field">
              <span>Status inicial</span>
              <select id="admin-status" name="status">
                <option>Publicado</option>
                <option>Rascunho</option>
                <option>Em revisao</option>
              </select>
            </label>

            <label class="communication-form-field communication-form-field--full">
              <span>Imagem do comunicado</span>
              <input id="admin-image" name="image" type="file" accept="image/*" />
              <small class="communication-field-help">Selecione uma imagem para destacar o comunicado na central e no carrossel da home.</small>
            </label>
          </div>

          <div class="communication-form-toggles">
            <label><input type="checkbox" name="highlighted" checked /> Destacar na central de comunicacao</label>
            <label><input type="checkbox" name="notifyAudience" /> Disparar notificacao para publico alvo</label>
            <label><input type="checkbox" name="allowAttachment" checked /> Permitir download de anexo</label>
          </div>

          <section class="card communication-admin-card communication-admin-card--embedded">
            <div class="card-header">Preview resumido</div>
            <div class="communication-admin-preview">
              <div class="communication-admin-preview-media" id="admin-image-preview">
                <span><i class="fa-regular fa-image"></i> Sem imagem selecionada</span>
              </div>
              <div class="comm-meta-row">
                <span class="comm-tag comm-tag--solid">Corporativo</span>
                <span class="comm-tag">Alta prioridade</span>
              </div>
              <h3>Comunicado oficial sobre atualizacao de processo interno</h3>
              <p>Este cartao antecipa como o item aparecera na central publica de comunicados apos a publicacao.</p>
              <div class="comm-item-facts">
                <span><i class="fa-regular fa-calendar"></i>19/06/2026</span>
                <span><i class="fa-solid fa-users"></i>Toda a companhia</span>
              </div>
            </div>
          </section>

          <div class="communication-form-actions">
            <button
              type="button"
              class="comm-secondary-button"
              data-feedback-message="Rascunho salvo em modo demonstrativo."
              data-feedback-tone="info"
            >
              Salvar rascunho
            </button>
            <button
              type="submit"
              class="feed-composer-submit"
            >
              Publicar comunicado
            </button>
          </div>
          </form>
        </section>

        <section class="card communication-form-card">
          <div class="card-header">Active Directory / LDAP</div>
          <div class="communication-section-intro">
            <strong>Configure autenticacao corporativa</strong>
            <p>Defina os parametros do diretorio para o futuro login por e-mail e senha dos colaboradores, mantendo o acesso da intranet restrito ao AD da empresa.</p>
          </div>
          ${ldapLoadNotice}
          <form id="ldap-settings-form">
            <div class="communication-form-grid">
              <label class="communication-form-field communication-form-field--full communication-checkbox-row">
                <span class="communication-checkbox-wrap">
                  <input name="isEnabled" type="checkbox" ${renderChecked(ldapSettings.isEnabled)} />
                  <strong>Habilitar login LDAP</strong>
                </span>
              </label>

              <label class="communication-form-field communication-form-field--full">
                <span>Servidor LDAP</span>
                <input name="server" type="text" value="${escapeHtml(ldapSettings.server || "")}" placeholder="dc-virtual-02.liotecnica.com.br" />
              </label>

              <label class="communication-form-field">
                <span>Porta</span>
                <input name="port" type="number" min="1" max="65535" value="${escapeHtml(String(ldapSettings.port || 389))}" />
              </label>

              <div class="communication-form-field communication-form-field--full communication-checkbox-group">
                <label><input name="useLdaps" type="checkbox" ${renderChecked(ldapSettings.useLdaps)} /> Usar LDAPS (SSL) - recomendado na porta 636</label>
                <label><input name="useStartTls" type="checkbox" ${renderChecked(ldapSettings.useStartTls)} /> Usar StartTLS na porta 389 (nao marque junto com LDAPS)</label>
                <label><input name="ignoreCertificateValidation" type="checkbox" ${renderChecked(ldapSettings.ignoreCertificateValidation)} /> Ignorar validacao do certificado (somente ambientes internos/HMG)</label>
              </div>

              <label class="communication-form-field communication-form-field--full">
                <span>Base DN</span>
                <input name="baseDn" type="text" value="${escapeHtml(ldapSettings.baseDn || "")}" placeholder="DC=liotecnica,DC=com,DC=br" />
              </label>

              <label class="communication-form-field communication-form-field--full">
                <span>Base de busca de usuarios (opcional)</span>
                <input name="userSearchBase" type="text" value="${escapeHtml(ldapSettings.userSearchBase || "")}" placeholder="OU=Usuarios,DC=liotecnica,DC=com,DC=br" />
              </label>

              <label class="communication-form-field communication-form-field--full">
                <span>Dominio Windows (NETBIOS)</span>
                <input name="netbiosDomain" type="text" value="${escapeHtml(ldapSettings.netbiosDomain || "")}" placeholder="LIOTECNICA" />
                <small class="communication-field-help">Obrigatorio quando o formato de login for DOMINIO\\usuario.</small>
              </label>

              <label class="communication-form-field communication-form-field--full">
                <span>Formato de login</span>
                <select name="loginFormat">
                  <option value="domain-backslash-samaccountname" ${renderSelected(loginFormat, "domain-backslash-samaccountname")}>Dominio\\usuario (sAMAccountName)</option>
                  <option value="email-or-upn-or-samaccountname" ${renderSelected(loginFormat, "email-or-upn-or-samaccountname")}>E-mail, UPN ou sAMAccountName</option>
                  <option value="userprincipalname" ${renderSelected(loginFormat, "userprincipalname")}>userPrincipalName (UPN)</option>
                  <option value="mail" ${renderSelected(loginFormat, "mail")}>E-mail (mail)</option>
                </select>
              </label>

              <label class="communication-form-field communication-form-field--full">
                <span>Conta de servico (Bind DN)</span>
                <input name="bindDn" type="text" value="${escapeHtml(ldapSettings.bindDn || "")}" placeholder="CN=servico-hub,OU=ServiceAccounts,DC=..." />
                <small class="communication-field-help">Obrigatorio no modo de busca no diretorio. Opcional no teste inicial de conexao.</small>
              </label>

              <label class="communication-form-field communication-form-field--full">
                <span>Senha da conta de servico (deixe em branco para manter)</span>
                <input name="serviceAccountPassword" type="password" value="" placeholder="${ldapSettings.hasServiceAccountPassword ? "Senha ja cadastrada" : "Digite a senha da conta de servico"}" />
                <small class="communication-field-help">${ldapSettings.hasServiceAccountPassword ? "Ja existe uma senha persistida no banco para esta conta." : "A senha sera persistida com protecao no backend."}</small>
              </label>

              <label class="communication-form-field communication-form-field--full">
                <span>Filtro LDAP de busca</span>
                <input name="searchFilter" type="text" value="${escapeHtml(ldapSettings.searchFilter || "(|(mail={0})(userPrincipalName={0})(sAMAccountName={0}))")}" placeholder="(|(mail={0})(userPrincipalName={0})(sAMAccountName={0}))" />
                <small class="communication-field-help">Use {0} para o login informado pelo colaborador.</small>
              </label>

              <label class="communication-form-field communication-form-field--full">
                <span>Atributo de nome exibido</span>
                <input name="displayNameAttribute" type="text" value="${escapeHtml(ldapSettings.displayNameAttribute || "displayName")}" placeholder="displayName" />
              </label>
            </div>

            <div class="communication-form-actions communication-form-actions--spread">
              <div class="communication-form-footnote">
                Salvar grava no banco. "Salvar e testar" tambem persiste antes do teste.
              </div>
              <div class="communication-form-action-group">
                <button type="submit" name="submitMode" value="save" class="feed-composer-submit">Salvar</button>
                <button type="submit" name="submitMode" value="save-test" class="comm-secondary-button">Salvar e testar conexao</button>
                <button type="reset" class="comm-tertiary-button">Cancelar</button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </section>
  `;
}

export { initCarousel, renderCarouselSection };
