import { showToast } from "../core/feedback.js?v=0.11.3";
import { APP_VERSION } from "../core/runtimeConfig.js?v=0.11.3";
import {
  getStoredPortalSession,
  loginWithLdap,
  resolvePortalPostLoginTarget
} from "../services/portalAuthService.js?v=0.11.3";

function renderVersionBadge() {
  const badge = document.querySelector(".app-version-badge");
  if (!badge) {
    return;
  }

  badge.textContent = `${APP_VERSION} • LOGIN`;
}

function redirectToPortal(hash = "#inicio") {
  window.location.href = `../${hash}`;
}

function bindPortalLoginForm() {
  const form = document.getElementById("portal-login-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const login = String(formData.get("login") || "").trim();
    const password = String(formData.get("password") || "");

    if (!login || !password) {
      showToast("Informe e-mail corporativo e senha para continuar.", "info");
      return;
    }

    const submitButton = form.querySelector("[type='submit']");
    const originalLabel = submitButton?.textContent || "Entrar na intranet";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Validando acesso...";
    }

    try {
      const session = await loginWithLdap(login, password);
      if (!session) {
        throw new Error("Sessao LDAP nao retornada.");
      }

      showToast(`Bem-vindo, ${session.user.displayName}.`, "success");
      window.setTimeout(() => {
        redirectToPortal(resolvePortalPostLoginTarget());
      }, 500);
    } catch (error) {
      console.error("Falha no login LDAP do portal.", error);
      showToast("Nao foi possivel autenticar com o LDAP. Revise e-mail e senha.", "danger");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
}

function tryRestorePortalSession() {
  const session = getStoredPortalSession();
  if (!session) {
    return;
  }

  redirectToPortal(resolvePortalPostLoginTarget());
}

function bootstrapLogin() {
  renderVersionBadge();
  bindPortalLoginForm();
  tryRestorePortalSession();
}

bootstrapLogin();
