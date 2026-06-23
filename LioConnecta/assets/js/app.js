import { bindAnalytics, trackInteraction } from "./analytics.js?v=0.12.8";
import { renderHeaderShell, renderSidebarPanels } from "./layout/index.js?v=0.12.8";
import {
  renderHero,
  renderMoodCard,
  renderErrorCard,
  renderEmptyState,
  renderLoadingHeader,
  renderLoadingPanel,
  renderLoadingHero,
  renderLoadingMoodCard,
  renderLoadingCarousel,
  renderLoadingFeed,
  getHomePageData
} from "./home/index.js?v=0.12.8";
import {
  renderCarouselSection,
  initCarousel,
  renderCommunicationsHub,
  renderCommunicationDetailPage,
  renderCommunicationAdminPage,
  renderAdminSettingsPage,
  renderAdminUsersPage,
  renderAdminUsersKpiSection,
  renderAdminUsersResultsSection,
  renderAdminUsersActivitySection,
  renderPortalUserModal,
  getCommunicationCenterData
} from "./communications/index.js?v=0.12.8";
import {
  renderHomePollHighlight,
  renderPollsHub,
  renderPollDetailPage,
  renderAdminPollsPage,
  getPollCenterData,
  getPollDetailData,
  getAdminPollData,
  createPoll,
  updatePoll,
  updatePollStatus,
  uploadPollAsset,
  votePoll
} from "./polls/index.js?v=0.12.8";
import { renderFeed } from "./feed/index.js?v=0.12.8";
import { bindInteractionFeedback, showToast } from "./core/feedback.js?v=0.12.10";
import { getRuntimeConfig } from "./core/runtimeConfig.js?v=0.12.10";
import { getPanelData } from "./services/panelService.js?v=0.12.8";
import { getUserHomeContext } from "./services/userService.js?v=0.12.8";
import { fetchAdminSession, getAdminAuthHeaders, getStoredAdminSession, isSuperAdminSession, redirectToAdminLogin } from "./services/adminAuthService.js?v=0.12.8";
import { fetchPortalSession, getPortalAuthHeaders, getStoredPortalSession, logoutPortal, redirectToPortalLogin } from "./services/portalAuthService.js?v=0.12.8";
import { getLdapSettingsData } from "./services/ldapSettingsService.js?v=0.12.8";
import { listPortalUsers } from "./services/portalUsersAdminService.js?v=0.12.8";

const ROUTES = Object.freeze({
  HOME: "inicio",
  COMMUNICATIONS: "comunicacao",
  COMMUNICATION_READ: "comunicacao/leitura",
  POLLS: "enquetes",
  POLL_READ: "enquetes/leitura",
  COMMUNICATION_ADMIN: "comunicacao/restrita",
  SETTINGS: "configuracoes",
  ADMIN_USERS: "admin/usuarios",
  ADMIN_POLLS: "admin/enquetes",
  PEOPLE: "pessoas-rh",
  SYSTEMS: "sistemas",
  PROJECTS: "projetos",
  RESOURCES: "recursos"
});

const BASE_NAV_ITEMS = Object.freeze([
  { route: ROUTES.HOME, label: "INICIO" },
  { route: ROUTES.COMMUNICATIONS, label: "COMUNICACAO" },
  { route: ROUTES.POLLS, label: "ENQUETES" },
  { route: ROUTES.PEOPLE, label: "PESSOAS (RH)" },
  { route: ROUTES.SYSTEMS, label: "SISTEMAS" },
  { route: ROUTES.PROJECTS, label: "PROJETOS" },
  { route: ROUTES.RESOURCES, label: "RECURSOS" }
]);

function getNavRoutes() {
  return isSuperAdminSession()
    ? [...BASE_NAV_ITEMS, { route: ROUTES.SETTINGS, label: "CONFIGURACOES" }]
    : [...BASE_NAV_ITEMS];
}

let shellInitialized = false;
let adminUsersRefreshBound = false;
let adminUsersSearchDebounce = 0;
let currentAdminUsersPage = createEmptyPortalUsersPage();
let currentAdminPollsPage = createEmptyAdminPollsPage();
let currentAdminPollEditingId = "";
let adminUsersQueryState = {
  query: "",
  status: "all",
  role: "all",
  department: "all",
  sortBy: "displayName",
  sortDirection: "asc",
  page: 1,
  pageSize: 8
};

function createEmptyPortalUsersPage() {
  return {
    items: [],
    summary: {
      registeredUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      departmentsMapped: 0,
      portalAdmins: 0,
      loginEvents: 0,
      failedLoginEvents: 0,
      logoutEvents: 0
    },
    roleOptions: [],
    departmentOptions: [],
    moduleOptions: [],
    accessLevelOptions: [],
    recentLogins: [],
    recentAuditEntries: [],
    page: 1,
    pageSize: 8,
    totalItems: 0,
    totalPages: 1,
    query: "",
    status: "all",
    role: "",
    department: "all",
    sortBy: "displayName",
    sortDirection: "asc"
  };
}

function createEmptyAdminPollsPage() {
  return {
    intro: {
      eyebrow: "ADMINISTRACAO",
      title: "Gestao de enquetes internas",
      subtitle: "Publique novas pesquisas e acompanhe a participacao do portal.",
      loadError: ""
    },
    items: [],
    summary: {
      totalPolls: 0,
      publishedPolls: 0,
      draftPolls: 0,
      closedPolls: 0,
      archivedPolls: 0,
      totalVotes: 0
    },
    statusOptions: [],
    resultsVisibilityOptions: []
  };
}

function buildAdminUsersQuery() {
  return {
    query: adminUsersQueryState.query,
    status: adminUsersQueryState.status,
    role: adminUsersQueryState.role,
    department: adminUsersQueryState.department,
    sortBy: adminUsersQueryState.sortBy,
    sortDirection: adminUsersQueryState.sortDirection,
    page: adminUsersQueryState.page,
    pageSize: adminUsersQueryState.pageSize
  };
}

function bindPortalTopbarActions() {
  const logoutButton = document.querySelector("[data-action='portal-logout']");
  if (!logoutButton || logoutButton.dataset.bound === "true") {
    return;
  }

  logoutButton.dataset.bound = "true";
  logoutButton.addEventListener("click", async () => {
    await logoutPortal();
    showToast("Sessao encerrada com sucesso.", "info");

    window.setTimeout(() => {
      redirectToPortalLogin(window.location.hash || "#inicio");
    }, 250);
  });
}

function applyLayoutMode(route) {
  const content = document.getElementById("main-content");
  if (!content) {
    return;
  }

  const isRestrictedArea =
    route === ROUTES.COMMUNICATION_ADMIN ||
    route === ROUTES.SETTINGS ||
    route === ROUTES.ADMIN_USERS ||
    route === ROUTES.ADMIN_POLLS;
  content.classList.toggle("content--single", isRestrictedArea);
}

async function setupServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const isLocalHost = ["127.0.0.1", "localhost"].includes(window.location.hostname);

  if (isLocalHost) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }

    return;
  }

  await navigator.serviceWorker.register("./service-worker.js");
}

function parseRoute() {
  const hash = window.location.hash.replace(/^#/, "").trim();

  if (!hash) {
    return { route: ROUTES.HOME, slug: "" };
  }

  if (hash.startsWith(`${ROUTES.COMMUNICATION_READ}/`)) {
    return {
      route: ROUTES.COMMUNICATION_READ,
      slug: hash.slice(`${ROUTES.COMMUNICATION_READ}/`.length)
    };
  }

  if (hash.startsWith(`${ROUTES.POLL_READ}/`)) {
    return {
      route: ROUTES.POLL_READ,
      slug: hash.slice(`${ROUTES.POLL_READ}/`.length)
    };
  }

  if (hash === ROUTES.COMMUNICATION_ADMIN) {
    return { route: ROUTES.COMMUNICATION_ADMIN, slug: "" };
  }

  if (hash === ROUTES.ADMIN_USERS) {
    return { route: ROUTES.ADMIN_USERS, slug: "" };
  }

  if (hash === ROUTES.ADMIN_POLLS) {
    return { route: ROUTES.ADMIN_POLLS, slug: "" };
  }

  if (getNavRoutes().some((item) => item.route === hash)) {
    return { route: hash, slug: "" };
  }

  return { route: ROUTES.HOME, slug: "" };
}

function buildNavItems(navItems = [], route = ROUTES.HOME) {
  const activeRoute = route === ROUTES.COMMUNICATION_READ
    ? ROUTES.COMMUNICATIONS
    : route === ROUTES.POLL_READ
      ? ROUTES.POLLS
      : route;
  const routes = getNavRoutes();

  return routes.map((item) => ({
    label: item.label,
    href: `#${item.route}`,
    active: item.route === activeRoute
  }));
}

function renderShell(data, route) {
  const header = document.getElementById("page-header");
  const leftSidebar = document.getElementById("left-sidebar");
  const rightSidebar = document.getElementById("right-sidebar");
  const isRestrictedArea =
    route === ROUTES.COMMUNICATION_ADMIN ||
    route === ROUTES.SETTINGS ||
    route === ROUTES.ADMIN_USERS ||
    route === ROUTES.ADMIN_POLLS;

  applyLayoutMode(route);

  header.innerHTML = renderHeaderShell({
    ...data,
    navItems: buildNavItems(data.navItems, route)
  });
  leftSidebar.innerHTML = isRestrictedArea ? "" : renderSidebarPanels(data.leftPanels);
  rightSidebar.innerHTML = isRestrictedArea ? "" : renderSidebarPanels(data.rightPanels);
  bindPortalTopbarActions();
}

function renderHomePage(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);

  centerContent.innerHTML = [
    renderHero(data.hero),
    renderMoodCard(data.mood),
    renderHomePollHighlight(data.pollHighlight),
    renderCarouselSection(data.carousel),
    renderFeed(data.feed, data.composer)
  ].join("");

  initCarousel();
}

function renderCommunicationsPage(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);
  centerContent.innerHTML = renderCommunicationsHub(data.communications);
}

function renderPollsPage(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);
  centerContent.innerHTML = renderPollsHub(data.polls, {
    canManage: isSuperAdminSession()
  });
  bindPublicPollActions(route);
}

function renderCommunicationReadPage(data, route, slug) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);

  const allCommunications = [...(data.communications.items || [])];
  const currentCommunication = allCommunications.find((item) => item?.slug === slug);

  centerContent.innerHTML = renderCommunicationDetailPage(currentCommunication);
}

function renderPollReadPage(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);
  centerContent.innerHTML = renderPollDetailPage(data.pollDetail);
  bindPublicPollActions(route);
}

function renderCommunicationAdminRoute(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);
  centerContent.innerHTML = renderCommunicationAdminPage(data.communications);
}

function renderAdminSettingsRoute(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);
  centerContent.innerHTML = renderAdminSettingsPage(data.ldapSettings);
}

function renderAdminPollsCurrentView() {
  const centerContent = document.getElementById("center-content");
  const selectedPoll = currentAdminPollsPage.items.find((item) => item?.id === currentAdminPollEditingId) || null;
  centerContent.innerHTML = renderAdminPollsPage(currentAdminPollsPage, selectedPoll);
  bindAdminPollActions();
}

function renderAdminPollsRoute(data, route) {
  renderShell(data, route);
  currentAdminPollsPage = {
    ...createEmptyAdminPollsPage(),
    ...(data.adminPollsPage || {})
  };

  if (currentAdminPollEditingId && !currentAdminPollsPage.items.some((item) => item?.id === currentAdminPollEditingId)) {
    currentAdminPollEditingId = "";
  }

  renderAdminPollsCurrentView();
}

function buildPollOptionRow(optionId = "", optionLabel = "", index = 0) {
  return `
    <div class="poll-option-editor" data-option-row>
      <input type="hidden" name="optionId" value="${optionId}" />
      <label class="communication-form-field">
        <span>Opcao ${index + 1}</span>
        <input type="text" name="optionLabel" value="${optionLabel}" placeholder="Descreva a alternativa" />
      </label>
      <button type="button" class="comm-tertiary-button" data-action="remove-poll-option">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;
}

function normalizeDateTimeInput(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function collectPollFormPayload(form) {
  const optionRows = Array.from(form.querySelectorAll("[data-option-row]"));
  const options = optionRows.map((row) => ({
    id: row.querySelector("input[name='optionId']")?.value?.trim() || null,
    label: row.querySelector("input[name='optionLabel']")?.value?.trim() || ""
  })).filter((item) => item.label);

  return {
    title: form.querySelector("[name='title']")?.value?.trim() || "",
    summary: form.querySelector("[name='summary']")?.value?.trim() || "",
    body: form.querySelector("[name='body']")?.value?.trim() || "",
    imageUrl: form.querySelector("[name='imageUrl']")?.value?.trim() || "",
    attachmentLabel: form.querySelector("[name='attachmentLabel']")?.value?.trim() || "",
    attachmentUrl: form.querySelector("[name='attachmentUrl']")?.value?.trim() || "",
    audience: form.querySelector("[name='audience']")?.value?.trim() || "Toda a companhia",
    status: form.querySelector("[name='status']")?.value || "Draft",
    resultsVisibility: form.querySelector("[name='resultsVisibility']")?.value || "AfterVote",
    allowMultipleChoices: Boolean(form.querySelector("[name='allowMultipleChoices']")?.checked),
    isFeatured: Boolean(form.querySelector("[name='isFeatured']")?.checked),
    publishedAtUtc: normalizeDateTimeInput(form.querySelector("[name='publishedAtUtc']")?.value || ""),
    closesAtUtc: normalizeDateTimeInput(form.querySelector("[name='closesAtUtc']")?.value || ""),
    options
  };
}

function replacePollAssetPreview(container, assetType, url) {
  const existing = container.querySelector(".poll-asset-preview");
  if (existing) {
    existing.remove();
  }

  const previewHtml = assetType === "image"
    ? `
      <div class="poll-asset-preview poll-asset-preview--image">
        <img src="${url}" alt="Imagem da enquete" loading="lazy" />
      </div>
    `
    : `
      <div class="poll-asset-preview">
        <i class="fa-solid fa-paperclip"></i>
        <span>${url}</span>
      </div>
    `;

  container.insertAdjacentHTML("beforeend", previewHtml);
}

async function uploadSelectedPollAsset(form, assetType, triggerButton) {
  const container = form.querySelector(`[data-poll-asset='${assetType}']`);
  const fileInput = container?.querySelector("input[type='file']");
  const valueInput = container?.querySelector(`input[name='${assetType === "image" ? "imageUrl" : "attachmentUrl"}']`);
  const file = fileInput?.files?.[0];

  if (!container || !fileInput || !valueInput || !file) {
    showToast("Selecione um arquivo antes de enviar.", "info");
    return;
  }

  const originalLabel = triggerButton.textContent;
  triggerButton.disabled = true;
  triggerButton.textContent = "Enviando...";

  try {
    const response = await uploadPollAsset(assetType, file, {
      headers: getAdminAuthHeaders()
    });

    valueInput.value = response?.url || "";
    replacePollAssetPreview(container, assetType, response?.url || "");
    fileInput.value = "";
    showToast(assetType === "image" ? "Imagem enviada com sucesso." : "Anexo enviado com sucesso.", "success");
  } catch (error) {
    console.error("Falha ao enviar ativo da enquete.", error);
    showToast(assetType === "image" ? "Nao foi possivel enviar a imagem." : "Nao foi possivel enviar o anexo.", "danger");
  } finally {
    triggerButton.disabled = false;
    triggerButton.textContent = originalLabel;
  }
}

async function refreshAdminPollsRoute(feedbackMessage = "", feedbackTone = "success", selectedPollId = currentAdminPollEditingId) {
  if (parseRoute().route !== ROUTES.ADMIN_POLLS) {
    return;
  }

  const data = await loadPageData(ROUTES.ADMIN_POLLS);
  currentAdminPollEditingId = selectedPollId || "";
  renderAdminPollsRoute(data, ROUTES.ADMIN_POLLS);

  if (feedbackMessage) {
    showToast(feedbackMessage, feedbackTone);
  }
}

function bindPublicPollActions(route) {
  const forms = Array.from(document.querySelectorAll("[data-action='submit-poll-vote']"));

  forms.forEach((form) => {
    if (form.dataset.bound === "true") {
      return;
    }

    form.dataset.bound = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const inputs = Array.from(form.querySelectorAll("input:checked"));
      const optionIds = inputs.map((input) => input.value).filter(Boolean);
      const pollId = form.getAttribute("data-poll-id") || "";

      if (!pollId || optionIds.length === 0) {
        showToast("Selecione ao menos uma opcao para registrar seu voto.", "danger");
        return;
      }

      try {
        await votePoll(pollId, optionIds, {
          headers: getPortalAuthHeaders()
        });
        showToast("Voto registrado com sucesso.", "success");
        await renderCurrentRoute();
      } catch (error) {
        console.error("Falha ao registrar voto na enquete.", error);
        showToast("Nao foi possivel registrar o voto nesta enquete.", "danger");
      }
    });
  });
}

function bindAdminPollActions() {
  const form = document.getElementById("admin-poll-form");
  const optionList = document.getElementById("poll-option-list");

  document.querySelectorAll("[data-action='admin-poll-edit']").forEach((button) => {
    button.addEventListener("click", () => {
      currentAdminPollEditingId = button.getAttribute("data-poll-id") || "";
      renderAdminPollsCurrentView();
    });
  });

  document.querySelectorAll("[data-action='admin-poll-status']").forEach((button) => {
    button.addEventListener("click", async () => {
      const pollId = button.getAttribute("data-poll-id") || "";
      const nextStatus = button.getAttribute("data-next-status") || "";

      if (!pollId || !nextStatus) {
        return;
      }

      try {
        await updatePollStatus(pollId, nextStatus, {
          headers: getAdminAuthHeaders()
        });
        await refreshAdminPollsRoute("Status da enquete atualizado com sucesso.", "success", currentAdminPollEditingId || pollId);
      } catch (error) {
        console.error("Falha ao atualizar status da enquete.", error);
        showToast("Nao foi possivel atualizar o status da enquete.", "danger");
      }
    });
  });

  if (!form || !optionList) {
    return;
  }

  form.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) {
      return;
    }

    const action = target.getAttribute("data-action");
    if (action === "add-poll-option") {
      event.preventDefault();
      const nextIndex = optionList.querySelectorAll("[data-option-row]").length;
      optionList.insertAdjacentHTML("beforeend", buildPollOptionRow("", "", nextIndex));
      return;
    }

    if (action === "remove-poll-option") {
      event.preventDefault();
      const rows = Array.from(optionList.querySelectorAll("[data-option-row]"));
      if (rows.length <= 2) {
        showToast("A enquete precisa manter pelo menos duas opcoes.", "info");
        return;
      }

      target.closest("[data-option-row]")?.remove();
      Array.from(optionList.querySelectorAll("[data-option-row]")).forEach((row, index) => {
        const label = row.querySelector("label span");
        if (label) {
          label.textContent = `Opcao ${index + 1}`;
        }
      });
      return;
    }

    if (action === "admin-poll-reset") {
      event.preventDefault();
      currentAdminPollEditingId = "";
      renderAdminPollsCurrentView();
      return;
    }

    if (action === "upload-poll-asset") {
      event.preventDefault();
      const assetType = target.getAttribute("data-asset-type") || "";
      await uploadSelectedPollAsset(form, assetType, target);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mode = form.getAttribute("data-mode") || "create";
    const pollId = form.getAttribute("data-poll-id") || "";
    const payload = collectPollFormPayload(form);

    if (payload.options.length < 2) {
      showToast("Inclua pelo menos duas alternativas na enquete.", "danger");
      return;
    }

    try {
      const response = mode === "edit" && pollId
        ? await updatePoll(pollId, payload, { headers: getAdminAuthHeaders() })
        : await createPoll(payload, { headers: getAdminAuthHeaders() });

      currentAdminPollEditingId = response?.id || "";
      await refreshAdminPollsRoute(
        mode === "edit" ? "Enquete atualizada com sucesso." : "Enquete criada com sucesso.",
        "success",
        currentAdminPollEditingId
      );
    } catch (error) {
      console.error("Falha ao salvar enquete administrativa.", error);
      showToast("Nao foi possivel salvar a enquete.", "danger");
    }
  });
}

async function refreshAdminUsersRoute(feedbackMessage = "", feedbackTone = "success") {
  if (parseRoute().route !== ROUTES.ADMIN_USERS) {
    return;
  }

  const data = await loadPageData(ROUTES.ADMIN_USERS);
  renderAdminUsersRoute(data, ROUTES.ADMIN_USERS);

  if (feedbackMessage) {
    showToast(feedbackMessage, feedbackTone);
  }
}

function renderAdminUsersDynamicSections(loadError = "") {
  const kpisHost = document.getElementById("admin-users-kpis-host");
  const resultsHost = document.getElementById("admin-users-results-host");
  const activityHost = document.getElementById("admin-users-activity-host");

  if (kpisHost) {
    kpisHost.innerHTML = renderAdminUsersKpiSection(currentAdminUsersPage.summary || createEmptyPortalUsersPage().summary);
  }

  if (resultsHost) {
    resultsHost.innerHTML = renderAdminUsersResultsSection(currentAdminUsersPage, loadError);
  }

  if (activityHost) {
    activityHost.innerHTML = renderAdminUsersActivitySection(currentAdminUsersPage);
  }
}

async function refreshAdminUsersDataOnly({
  feedbackMessage = "",
  feedbackTone = "success",
  preserveModalUserId = "",
  preserveModalMode = "edit"
} = {}) {
  const portalUsersPage = await listPortalUsers(buildAdminUsersQuery(), {
    headers: getAdminAuthHeaders()
  });

  currentAdminUsersPage = {
    ...createEmptyPortalUsersPage(),
    ...portalUsersPage
  };

  adminUsersQueryState = {
    ...adminUsersQueryState,
    query: portalUsersPage.query ?? "",
    status: portalUsersPage.status || "all",
    role: portalUsersPage.role || "all",
    department: portalUsersPage.department || "all",
    sortBy: portalUsersPage.sortBy || "displayName",
    sortDirection: portalUsersPage.sortDirection || "asc",
    page: portalUsersPage.page || adminUsersQueryState.page,
    pageSize: portalUsersPage.pageSize || adminUsersQueryState.pageSize
  };

  renderAdminUsersDynamicSections("");
  bindAdminUsersFilters();
  bindAdminUsersModal();

  if (preserveModalUserId) {
    const stillExists = currentAdminUsersPage.items.some((item) => item?.id === preserveModalUserId);
    if (stillExists) {
      openPortalUserModal(preserveModalUserId, preserveModalMode);
    } else {
      closePortalUserModal();
    }
  }

  if (feedbackMessage) {
    showToast(feedbackMessage, feedbackTone);
  }
}

function bindAdminUsersFilters() {
  const searchInput = document.getElementById("admin-user-search");
  const statusFilter = document.getElementById("admin-user-status-filter");
  const roleFilter = document.getElementById("admin-user-role-filter");
  const departmentFilter = document.getElementById("admin-user-department-filter");
  const pageButtons = Array.from(document.querySelectorAll("[data-action='admin-users-page']"));
  const sortButtons = Array.from(document.querySelectorAll("[data-action='admin-users-sort']"));

  if (!searchInput || !statusFilter || !roleFilter || !departmentFilter) {
    return;
  }

  if (searchInput.dataset.bound !== "true") {
    searchInput.dataset.bound = "true";
    searchInput.addEventListener("input", () => {
      window.clearTimeout(adminUsersSearchDebounce);
      adminUsersSearchDebounce = window.setTimeout(() => {
        adminUsersQueryState = {
          ...adminUsersQueryState,
          query: searchInput.value.trim(),
          page: 1
        };

        refreshAdminUsersRoute().catch((error) => {
          console.error("Falha ao pesquisar usuarios administrativos.", error);
          showToast("Nao foi possivel atualizar a busca de usuarios.", "danger");
        });
      }, 260);
    });
  }

  if (statusFilter.dataset.bound !== "true") {
    statusFilter.dataset.bound = "true";
    statusFilter.addEventListener("change", () => {
      adminUsersQueryState = {
        ...adminUsersQueryState,
        status: statusFilter.value,
        page: 1
      };

      refreshAdminUsersRoute().catch((error) => {
        console.error("Falha ao filtrar usuarios por status.", error);
        showToast("Nao foi possivel aplicar o filtro de status.", "danger");
      });
    });
  }

  if (roleFilter.dataset.bound !== "true") {
    roleFilter.dataset.bound = "true";
    roleFilter.addEventListener("change", () => {
      adminUsersQueryState = {
        ...adminUsersQueryState,
        role: roleFilter.value,
        page: 1
      };

      refreshAdminUsersRoute().catch((error) => {
        console.error("Falha ao filtrar usuarios por perfil.", error);
        showToast("Nao foi possivel aplicar o filtro de perfil.", "danger");
      });
    });
  }

  if (departmentFilter.dataset.bound !== "true") {
    departmentFilter.dataset.bound = "true";
    departmentFilter.addEventListener("change", () => {
      adminUsersQueryState = {
        ...adminUsersQueryState,
        department: departmentFilter.value,
        page: 1
      };

      refreshAdminUsersRoute().catch((error) => {
        console.error("Falha ao filtrar usuarios por departamento.", error);
        showToast("Nao foi possivel aplicar o filtro de departamento.", "danger");
      });
    });
  }

  pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.getAttribute("data-page") || adminUsersQueryState.page);
      if (!nextPage || Number.isNaN(nextPage) || nextPage < 1 || nextPage === adminUsersQueryState.page) {
        return;
      }

      adminUsersQueryState = {
        ...adminUsersQueryState,
        page: nextPage
      };

      refreshAdminUsersRoute().catch((error) => {
        console.error("Falha ao paginar usuarios administrativos.", error);
        showToast("Nao foi possivel trocar de pagina.", "danger");
      });
    });
  });

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      adminUsersQueryState = {
        ...adminUsersQueryState,
        sortBy: button.getAttribute("data-sort-by") || "displayName",
        sortDirection: button.getAttribute("data-sort-direction") || "asc",
        page: 1
      };

      refreshAdminUsersRoute().catch((error) => {
        console.error("Falha ao ordenar usuarios administrativos.", error);
        showToast("Nao foi possivel aplicar a ordenacao.", "danger");
      });
    });
  });
}

function closePortalUserModal() {
  const modal = document.getElementById("portal-user-modal");
  const body = document.getElementById("portal-user-modal-body");

  if (!modal || !body) {
    return;
  }

  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  body.innerHTML = "";
  document.body.classList.remove("modal-open");
}

function openPortalUserModal(userId, mode = "view") {
  const modal = document.getElementById("portal-user-modal");
  const body = document.getElementById("portal-user-modal-body");

  if (!modal || !body) {
    return;
  }

  const pageViewModel = {
    ...createEmptyPortalUsersPage(),
    ...(currentAdminUsersPage || {})
  };
  const items = Array.isArray(pageViewModel.items) ? pageViewModel.items : [];
  const roleOptions = Array.isArray(pageViewModel.roleOptions) ? pageViewModel.roleOptions : [];
  const accessLevelOptions = Array.isArray(pageViewModel.accessLevelOptions) ? pageViewModel.accessLevelOptions : [];
  const selectedUser = items.find((item) => item?.id === userId);

  if (!selectedUser) {
    showToast("Nao foi possivel localizar o usuario selecionado.", "danger");
    return;
  }

  body.innerHTML = renderPortalUserModal(selectedUser, roleOptions, accessLevelOptions, mode);
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function bindAdminUsersModal() {
  const centerContent = document.getElementById("center-content");
  const modal = document.getElementById("portal-user-modal");

  if (!centerContent || !modal) {
    return;
  }

  centerContent.querySelectorAll("[data-action='open-portal-user-modal']").forEach((button) => {
    button.addEventListener("click", () => {
      openPortalUserModal(
        button.getAttribute("data-user-id") || "",
        button.getAttribute("data-user-mode") || "view"
      );
    });
  });

  if (modal.dataset.bound !== "true") {
    modal.dataset.bound = "true";

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closePortalUserModal();
        return;
      }

      const closeButton = event.target.closest("[data-action='close-portal-user-modal']");
      if (closeButton) {
        closePortalUserModal();
        return;
      }

      const switchModeButton = event.target.closest("[data-action='portal-user-modal-switch-mode']");
      if (switchModeButton) {
        openPortalUserModal(
          switchModeButton.getAttribute("data-user-id") || "",
          switchModeButton.getAttribute("data-user-mode") || "view"
        );
      }
    });
  }
}

function renderAdminUsersRoute(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);
  currentAdminUsersPage = {
    ...createEmptyPortalUsersPage(),
    ...(data.portalUsersPage || {})
  };
  centerContent.innerHTML = renderAdminUsersPage(currentAdminUsersPage, data.portalUsersLoadError);
  bindAdminUsersFilters();
  bindAdminUsersModal();
}

async function ensureRestrictedAdminAccess(route = ROUTES.COMMUNICATION_ADMIN) {
  const session = getStoredAdminSession();
  if (!session) {
    redirectToAdminLogin(`#${route}`);
    return false;
  }

  try {
    const validatedSession = await fetchAdminSession();
    if (!validatedSession) {
      redirectToAdminLogin(`#${route}`);
      return false;
    }

    if ((route === ROUTES.SETTINGS || route === ROUTES.ADMIN_USERS) && !isSuperAdminSession(validatedSession)) {
      window.location.hash = "#comunicacao/restrita";
      showToast("Esta area e restrita ao super-admin.", "danger");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Falha ao validar sessao administrativa.", error);
    redirectToAdminLogin(`#${route}`);
    return false;
  }
}

async function ensurePortalAccess() {
  const session = getStoredPortalSession();
  if (!session) {
    redirectToPortalLogin(window.location.hash || "#inicio");
    return false;
  }

  try {
    const validatedSession = await fetchPortalSession();
    if (!validatedSession) {
      redirectToPortalLogin(window.location.hash || "#inicio");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Falha ao validar sessao do portal.", error);
    redirectToPortalLogin(window.location.hash || "#inicio");
    return false;
  }
}

function renderPlaceholderPage(data, route) {
  const centerContent = document.getElementById("center-content");
  const activeItem = buildNavItems(data.navItems, route).find((item) => item.active);
  renderShell(data, route);
  centerContent.innerHTML = `
    <section class="card">
      <div class="card-header">${activeItem?.label ?? "Modulo"}</div>
      ${renderEmptyState(
        "Modulo em estruturacao",
        "Esta area ainda sera detalhada no MVP, mas ja esta reservada na navegacao da LIOCONNECTA."
      )}
    </section>
  `;
}

function renderLoadingApp() {
  const header = document.getElementById("page-header");
  const leftSidebar = document.getElementById("left-sidebar");
  const centerContent = document.getElementById("center-content");
  const rightSidebar = document.getElementById("right-sidebar");

  header.innerHTML = renderLoadingHeader();
  leftSidebar.innerHTML = [
    renderLoadingPanel("Carregando jornada"),
    renderLoadingPanel("Carregando painel"),
    renderLoadingPanel("Carregando indicadores")
  ].join("");
  rightSidebar.innerHTML = [
    renderLoadingPanel("Carregando atalhos"),
    renderLoadingPanel("Carregando perfil"),
    renderLoadingPanel("Carregando agenda")
  ].join("");
  centerContent.innerHTML = [
    renderLoadingHero(),
    renderLoadingMoodCard(),
    renderLoadingCarousel(),
    renderLoadingFeed()
  ].join("");
}

function renderBootstrapError() {
  document.getElementById("center-content").innerHTML = renderErrorCard(
    "Erro ao carregar o prototipo",
    "Nao conseguimos montar o mock tecnico neste momento. Revise os arquivos de dados, o modo ativo da aplicacao e tente novamente."
  );
}

function renderRuntimeBadge() {
  const badge = document.querySelector(".app-version-badge");
  if (!badge) {
    return;
  }

  const config = getRuntimeConfig();
  const modeLabel = config.dataMode === "mock" ? "HYBRID" : config.dataMode.toUpperCase();
  badge.textContent = `${config.version} • ${modeLabel}`;
}

async function loadPageData(route, slug = "") {
  if (route === ROUTES.HOME) {
    return getHomePageData();
  }

  const [userContext, panels] = await Promise.all([
    getUserHomeContext(),
    getPanelData()
  ]);

  if (
    route === ROUTES.COMMUNICATIONS ||
    route === ROUTES.COMMUNICATION_READ
  ) {
    const communications = await getCommunicationCenterData();
    return {
      ...userContext,
      ...panels,
      communications
    };
  }

  if (route === ROUTES.POLLS) {
    const polls = await getPollCenterData({
      headers: getPortalAuthHeaders()
    });

    return {
      ...userContext,
      ...panels,
      polls
    };
  }

  if (route === ROUTES.POLL_READ) {
    const pollDetail = await getPollDetailData(slug, {
      headers: getPortalAuthHeaders()
    });

    return {
      ...userContext,
      ...panels,
      pollDetail
    };
  }

  if (route === ROUTES.COMMUNICATION_ADMIN) {
    const communications = await getCommunicationCenterData();

    return {
      ...userContext,
      ...panels,
      communications
    };
  }

  if (route === ROUTES.SETTINGS) {
    const ldapSettings = await getLdapSettingsData({
      headers: getAdminAuthHeaders()
    });

    return {
      ...userContext,
      ...panels,
      ldapSettings
    };
  }

  if (route === ROUTES.ADMIN_USERS) {
    try {
      const portalUsersPage = await listPortalUsers(buildAdminUsersQuery(), {
        headers: getAdminAuthHeaders()
      });

      adminUsersQueryState = {
        ...adminUsersQueryState,
        query: portalUsersPage.query ?? "",
        status: portalUsersPage.status || "all",
        role: portalUsersPage.role || "all",
        department: portalUsersPage.department || "all",
        sortBy: portalUsersPage.sortBy || "displayName",
        sortDirection: portalUsersPage.sortDirection || "asc",
        page: portalUsersPage.page || adminUsersQueryState.page,
        pageSize: portalUsersPage.pageSize || adminUsersQueryState.pageSize
      };

      return {
        ...userContext,
        ...panels,
        portalUsersPage,
        portalUsersLoadError: ""
      };
    } catch (error) {
      console.error("Falha ao carregar usuarios administrativos do portal.", error);

      return {
        ...userContext,
        ...panels,
        portalUsersPage: createEmptyPortalUsersPage(),
        portalUsersLoadError: "Nao foi possivel consultar a API administrativa de usuarios. Verifique se a API do ambiente esta ativa."
      };
    }
  }

  if (route === ROUTES.ADMIN_POLLS) {
    const adminPollsPage = await getAdminPollData({
      headers: getAdminAuthHeaders()
    });

    return {
      ...userContext,
      ...panels,
      adminPollsPage
    };
  }

  return {
    ...userContext,
    ...panels
  };
}

async function renderCurrentRoute() {
  const { route, slug } = parseRoute();
  renderRuntimeBadge();
  renderLoadingApp();

  if (route === ROUTES.COMMUNICATION_ADMIN || route === ROUTES.SETTINGS || route === ROUTES.ADMIN_USERS || route === ROUTES.ADMIN_POLLS) {
    const authorized = await ensureRestrictedAdminAccess(route);
    if (!authorized) {
      return;
    }
  } else {
    const authorized = await ensurePortalAccess();
    if (!authorized) {
      return;
    }
  }

  const data = await loadPageData(route, slug);

  if (route === ROUTES.HOME) {
    renderHomePage(data, route);
  } else if (route === ROUTES.COMMUNICATIONS) {
    renderCommunicationsPage(data, route);
  } else if (route === ROUTES.COMMUNICATION_READ) {
    renderCommunicationReadPage(data, route, slug);
  } else if (route === ROUTES.POLLS) {
    renderPollsPage(data, route);
  } else if (route === ROUTES.POLL_READ) {
    renderPollReadPage(data, route);
  } else if (route === ROUTES.COMMUNICATION_ADMIN) {
    renderCommunicationAdminRoute(data, route);
  } else if (route === ROUTES.SETTINGS) {
    renderAdminSettingsRoute(data, route);
  } else if (route === ROUTES.ADMIN_USERS) {
    renderAdminUsersRoute(data, route);
  } else if (route === ROUTES.ADMIN_POLLS) {
    renderAdminPollsRoute(data, route);
  } else {
    renderPlaceholderPage(data, route);
  }

  bindAnalytics(document);
  trackInteraction("page.view", { route, slug });
}

async function bootstrap() {
  bindInteractionFeedback(document);

  if (!adminUsersRefreshBound) {
    document.addEventListener("portal-users:refresh", (event) => {
      const detail = event.detail || {};
      refreshAdminUsersDataOnly({
        feedbackMessage: detail.message || "",
        feedbackTone: detail.tone || "success",
        preserveModalUserId: detail.preserveModalUserId || "",
        preserveModalMode: detail.preserveModalMode || "edit"
      }).catch((error) => {
        console.error("Falha ao atualizar a tela de usuarios administrativos.", error);
        showToast("Nao foi possivel recarregar os usuarios apos a atualizacao.", "danger");
      });
    });

    adminUsersRefreshBound = true;
  }

  const { route } = parseRoute();
  if (route === ROUTES.COMMUNICATION_ADMIN || route === ROUTES.SETTINGS || route === ROUTES.ADMIN_USERS || route === ROUTES.ADMIN_POLLS) {
    const hasAdminAccess = await ensureRestrictedAdminAccess(route);
    if (!hasAdminAccess) {
      return;
    }
  } else {
    const hasPortalAccess = await ensurePortalAccess();
    if (!hasPortalAccess) {
      return;
    }
  }

  if (!shellInitialized) {
    window.addEventListener("hashchange", () => {
      renderCurrentRoute().catch((error) => {
        console.error("Falha ao trocar de rota na LIOCONNECTA.", error);
        renderBootstrapError();
      });
    });

    shellInitialized = true;
  }

  await renderCurrentRoute();
  await setupServiceWorker();
  trackInteraction("app.loaded", { source: "bootstrap" });
}

bootstrap().catch((error) => {
  console.error("Falha ao iniciar a LIOCONNECTA.", error);
  renderBootstrapError();
});
