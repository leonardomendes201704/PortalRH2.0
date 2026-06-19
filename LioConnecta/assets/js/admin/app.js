import { showToast } from "../core/feedback.js?v=0.11.2";
import { loginAdmin, fetchAdminSession, getStoredAdminSession, resolvePostLoginTarget } from "../services/adminAuthService.js?v=0.11.2";
import { getRuntimeConfig } from "../core/runtimeConfig.js?v=0.11.2";

function renderVersionBadge() {
  const badge = document.querySelector(".app-version-badge");
  if (!badge) {
    return;
  }

  const config = getRuntimeConfig();
  badge.textContent = `${config.version} • ADMIN`;
}

function redirectToPortal(hash = "#comunicacao/restrita") {
  window.location.href = `../${hash}`;
}

async function tryRestoreSession() {
  const session = getStoredAdminSession();
  if (!session) {
    return;
  }

  try {
    const validated = await fetchAdminSession();
    if (validated) {
      redirectToPortal(resolvePostLoginTarget());
    }
  } catch {
    // Sessao expirada ou invalida: segue para login manual.
  }
}

function bindLoginForm() {
  const form = document.getElementById("admin-login-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (!username || !password) {
      showToast("Informe usuario e senha para continuar.", "info");
      return;
    }

    const submitButton = form.querySelector("[type='submit']");
    const originalLabel = submitButton?.textContent;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Autenticando...";
    }

    try {
      const session = await loginAdmin(username, password);
      if (!session) {
        throw new Error("Credenciais invalidas.");
      }

      showToast("Login administrativo realizado com sucesso.", "success");
      window.setTimeout(() => {
        redirectToPortal(resolvePostLoginTarget());
      }, 500);
    } catch (error) {
      console.error("Falha no login administrativo.", error);
      showToast("Usuario ou senha invalidos. Tente novamente.", "danger");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel || "Entrar na area admin";
      }
    }
  });
}

async function bootstrapAdminLogin() {
  renderVersionBadge();
  bindLoginForm();
  await tryRestoreSession();
}

bootstrapAdminLogin().catch((error) => {
  console.error("Falha ao iniciar o login administrativo.", error);
  showToast("Nao foi possivel carregar a tela de login administrativo.", "danger");
});
