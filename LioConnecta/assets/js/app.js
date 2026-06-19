import { bindAnalytics, trackInteraction } from "./analytics.js?v=0.11.2";
import { renderHeaderShell, renderSidebarPanels } from "./layout/index.js?v=0.11.2";
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
} from "./home/index.js?v=0.11.2";
import {
  renderCarouselSection,
  initCarousel,
  renderCommunicationsHub,
  renderCommunicationDetailPage,
  renderCommunicationAdminPage,
  getCommunicationCenterData
} from "./communications/index.js?v=0.11.2";
import { renderFeed } from "./feed/index.js?v=0.11.2";
import { bindInteractionFeedback } from "./core/feedback.js?v=0.11.2";
import { getRuntimeConfig } from "./core/runtimeConfig.js?v=0.11.2";
import { getPanelData } from "./services/panelService.js?v=0.11.2";
import { getUserHomeContext } from "./services/userService.js?v=0.11.2";
import { fetchAdminSession, getAdminAuthHeaders, getStoredAdminSession, redirectToAdminLogin } from "./services/adminAuthService.js?v=0.11.2";
import { getLdapSettingsData } from "./services/ldapSettingsService.js?v=0.11.2";

const ROUTES = Object.freeze({
  HOME: "inicio",
  COMMUNICATIONS: "comunicacao",
  COMMUNICATION_READ: "comunicacao/leitura",
  COMMUNICATION_ADMIN: "comunicacao/restrita",
  PEOPLE: "pessoas-rh",
  SYSTEMS: "sistemas",
  PROJECTS: "projetos",
  RESOURCES: "recursos"
});

const NAV_ROUTES = [
  ROUTES.HOME,
  ROUTES.COMMUNICATIONS,
  ROUTES.PEOPLE,
  ROUTES.SYSTEMS,
  ROUTES.PROJECTS,
  ROUTES.RESOURCES
];

let shellInitialized = false;

function applyLayoutMode(route) {
  const content = document.getElementById("main-content");
  if (!content) {
    return;
  }

  const isRestrictedCommunication = route === ROUTES.COMMUNICATION_ADMIN;
  content.classList.toggle("content--single", isRestrictedCommunication);
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

  if (hash === ROUTES.COMMUNICATION_ADMIN) {
    return { route: ROUTES.COMMUNICATION_ADMIN, slug: "" };
  }

  if (NAV_ROUTES.includes(hash)) {
    return { route: hash, slug: "" };
  }

  return { route: ROUTES.HOME, slug: "" };
}

function buildNavItems(navItems = [], route = ROUTES.HOME) {
  const activeRoute = route === ROUTES.COMMUNICATION_READ ? ROUTES.COMMUNICATIONS : route;

  return navItems.map((item, index) => ({
    ...item,
    href: `#${NAV_ROUTES[index] ?? ROUTES.HOME}`,
    active: NAV_ROUTES[index] === activeRoute
  }));
}

function renderShell(data, route) {
  const header = document.getElementById("page-header");
  const leftSidebar = document.getElementById("left-sidebar");
  const rightSidebar = document.getElementById("right-sidebar");
  const isRestrictedCommunication = route === ROUTES.COMMUNICATION_ADMIN;

  applyLayoutMode(route);

  header.innerHTML = renderHeaderShell({
    ...data,
    navItems: buildNavItems(data.navItems, route)
  });
  leftSidebar.innerHTML = isRestrictedCommunication ? "" : renderSidebarPanels(data.leftPanels);
  rightSidebar.innerHTML = isRestrictedCommunication ? "" : renderSidebarPanels(data.rightPanels);
}

function renderHomePage(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);

  centerContent.innerHTML = [
    renderHero(data.hero),
    renderMoodCard(data.mood),
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

function renderCommunicationReadPage(data, route, slug) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);

  const allCommunications = [...(data.communications.items || [])];
  const currentCommunication = allCommunications.find((item) => item?.slug === slug);

  centerContent.innerHTML = renderCommunicationDetailPage(currentCommunication);
}

function renderCommunicationAdminRoute(data, route) {
  const centerContent = document.getElementById("center-content");
  renderShell(data, route);
  centerContent.innerHTML = renderCommunicationAdminPage(data.communications, data.ldapSettings);
}

async function ensureRestrictedAdminAccess() {
  const session = getStoredAdminSession();
  if (!session) {
    redirectToAdminLogin("#comunicacao/restrita");
    return false;
  }

  try {
    const validatedSession = await fetchAdminSession();
    if (!validatedSession) {
      redirectToAdminLogin("#comunicacao/restrita");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Falha ao validar sessao administrativa.", error);
    redirectToAdminLogin("#comunicacao/restrita");
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

async function loadPageData(route) {
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

  if (route === ROUTES.COMMUNICATION_ADMIN) {
    const [communications, ldapSettings] = await Promise.all([
      getCommunicationCenterData(),
      getLdapSettingsData({
        headers: getAdminAuthHeaders()
      })
    ]);

    return {
      ...userContext,
      ...panels,
      communications,
      ldapSettings
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

  if (route === ROUTES.COMMUNICATION_ADMIN) {
    const authorized = await ensureRestrictedAdminAccess();
    if (!authorized) {
      return;
    }
  }

  const data = await loadPageData(route);

  if (route === ROUTES.HOME) {
    renderHomePage(data, route);
  } else if (route === ROUTES.COMMUNICATIONS) {
    renderCommunicationsPage(data, route);
  } else if (route === ROUTES.COMMUNICATION_READ) {
    renderCommunicationReadPage(data, route, slug);
  } else if (route === ROUTES.COMMUNICATION_ADMIN) {
    renderCommunicationAdminRoute(data, route);
  } else {
    renderPlaceholderPage(data, route);
  }

  bindAnalytics(document);
  trackInteraction("page.view", { route, slug });
}

async function bootstrap() {
  bindInteractionFeedback(document);

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
