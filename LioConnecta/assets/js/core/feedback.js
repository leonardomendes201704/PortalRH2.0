import { createCommunication } from "../services/communicationService.js";
import { getAdminAuthHeaders, logoutAdmin, redirectToAdminLogin } from "../services/adminAuthService.js";
import { saveLdapSettings } from "../services/ldapSettingsService.js";

let feedbackBound = false;
let selectedImageDataUrl = "";

function formatAdminDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) {
    return String(value);
  }

  return `${day}/${month}/${year}`;
}

function ensureToastHost() {
  let host = document.querySelector(".app-toast-stack");

  if (!host) {
    host = document.createElement("div");
    host.className = "app-toast-stack";
    host.setAttribute("aria-live", "polite");
    host.setAttribute("aria-atomic", "true");
    document.body.appendChild(host);
  }

  return host;
}

export function showToast(message, tone = "info") {
  const host = ensureToastHost();
  const toast = document.createElement("div");
  toast.className = `app-toast app-toast--${tone}`;
  toast.textContent = message;
  host.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 2600);
}

export function bindInteractionFeedback(root = document) {
  if (feedbackBound) {
    return;
  }

  feedbackBound = true;

  root.addEventListener("change", (event) => {
    const imageInput = event.target.closest("#admin-image");
    if (!imageInput) {
      return;
    }

    const file = imageInput.files?.[0];
    const preview = document.getElementById("admin-image-preview");

    if (!file || !preview) {
      selectedImageDataUrl = "";
      if (preview) {
        preview.innerHTML = `<span><i class="fa-regular fa-image"></i> Sem imagem selecionada</span>`;
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      selectedImageDataUrl = typeof reader.result === "string" ? reader.result : "";
      preview.innerHTML = selectedImageDataUrl
        ? `<img src="${selectedImageDataUrl}" alt="Preview da imagem do comunicado">`
        : `<span><i class="fa-regular fa-image"></i> Sem imagem selecionada</span>`;
    };
    reader.readAsDataURL(file);
  });

  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("#communication-admin-form");
    if (form) {
      event.preventDefault();

      const formData = new FormData(form);
      const title = String(formData.get("title") || "").trim();
      const summary = String(formData.get("summary") || "").trim();
      const bodyText = String(formData.get("body") || "").trim();

      if (!title || !summary) {
        showToast("Preencha pelo menos titulo e resumo para publicar.", "info");
        return;
      }

      const submitButton = form.querySelector("[type='submit']");
      const originalButtonLabel = submitButton?.textContent;

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Publicando...";
      }

      try {
        const publishedValue = String(formData.get("publishedAt") || "").trim();

        await createCommunication({
          title,
          category: String(formData.get("category") || "Corporativo"),
          priority: String(formData.get("priority") || "Comunicado"),
          summary,
          publishedAt: publishedValue ? new Date(`${publishedValue}T09:00:00`).toISOString() : new Date().toISOString(),
          audience: String(formData.get("audience") || "Toda a companhia"),
          channel: String(formData.get("channel") || "Portal"),
          status: String(formData.get("status") || "Publicado"),
          owner: String(formData.get("owner") || "Comunicacao Corporativa"),
          attachmentLabel: String(formData.get("attachmentLabel") || "Abrir anexo"),
          imageUrl: selectedImageDataUrl,
          isFeatured: Boolean(formData.get("highlighted")),
          body: bodyText
        }, {
          headers: getAdminAuthHeaders()
        });

        showToast(`Comunicado publicado com sucesso no backend local${publishedValue ? ` em ${formatAdminDate(publishedValue)}` : ""}.`, "success");
        window.setTimeout(() => {
          window.location.hash = "#comunicacao";
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("Falha ao publicar comunicado na API.", error);

        const message = error instanceof Error && error.message.includes("HTTP 401")
          ? "Sua sessao administrativa expirou. Faca login novamente para publicar."
          : "Nao foi possivel publicar o comunicado agora. Verifique se a API esta ativa em localhost:5001.";

        showToast(message, "danger");

        if (error instanceof Error && error.message.includes("HTTP 401")) {
          window.setTimeout(() => {
            redirectToAdminLogin("#comunicacao/restrita");
          }, 700);
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonLabel || "Publicar comunicado";
        }
      }
      return;
    }

    const ldapForm = event.target.closest("#ldap-settings-form");
    if (ldapForm) {
      event.preventDefault();

      const formData = new FormData(ldapForm);
      const submitter = event.submitter;
      const submitMode = submitter?.value || "save";
      const originalLabel = submitter?.textContent;

      if (submitter) {
        submitter.disabled = true;
        submitter.textContent = submitMode === "save-test" ? "Salvando..." : "Salvando...";
      }

      try {
        await saveLdapSettings({
          isEnabled: Boolean(formData.get("isEnabled")),
          server: String(formData.get("server") || ""),
          port: Number(formData.get("port") || 389),
          useLdaps: Boolean(formData.get("useLdaps")),
          useStartTls: Boolean(formData.get("useStartTls")),
          ignoreCertificateValidation: Boolean(formData.get("ignoreCertificateValidation")),
          baseDn: String(formData.get("baseDn") || ""),
          userSearchBase: String(formData.get("userSearchBase") || ""),
          netbiosDomain: String(formData.get("netbiosDomain") || ""),
          loginFormat: String(formData.get("loginFormat") || ""),
          bindDn: String(formData.get("bindDn") || ""),
          serviceAccountPassword: String(formData.get("serviceAccountPassword") || ""),
          searchFilter: String(formData.get("searchFilter") || ""),
          displayNameAttribute: String(formData.get("displayNameAttribute") || "")
        }, {
          headers: getAdminAuthHeaders()
        });

        const message = submitMode === "save-test"
          ? "Configuracao LDAP salva com sucesso. O teste real de conexao sera conectado na proxima etapa."
          : "Configuracao LDAP salva com sucesso no banco.";

        showToast(message, "success");
        ldapForm.reset();
        window.setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        console.error("Falha ao salvar configuracao LDAP.", error);

        const message = error instanceof Error && error.message.includes("HTTP 401")
          ? "Sua sessao administrativa expirou. Faca login novamente para continuar."
          : "Nao foi possivel salvar a configuracao LDAP agora.";

        showToast(message, "danger");

        if (error instanceof Error && error.message.includes("HTTP 401")) {
          window.setTimeout(() => {
            redirectToAdminLogin("#comunicacao/restrita");
          }, 700);
        }
      } finally {
        if (submitter) {
          submitter.disabled = false;
          submitter.textContent = originalLabel || (submitMode === "save-test" ? "Salvar e testar conexao" : "Salvar");
        }
      }
    }
  });

  root.addEventListener("click", (event) => {
    const customFeedback = event.target.closest("[data-feedback-message]");
    if (customFeedback) {
      showToast(
        customFeedback.getAttribute("data-feedback-message") || "Acao executada.",
        customFeedback.getAttribute("data-feedback-tone") || "info"
      );
      return;
    }

    const retryButton = event.target.closest("[data-action='retry-bootstrap']");
    if (retryButton) {
      window.location.reload();
      return;
    }

    const adminLogoutButton = event.target.closest("[data-action='admin-logout']");
    if (adminLogoutButton) {
      event.preventDefault();
      logoutAdmin().finally(() => {
        redirectToAdminLogin("#comunicacao/restrita");
      });
      return;
    }

    const moodButton = event.target.closest(".mood-option");
    if (moodButton) {
      const label = moodButton.querySelector("strong")?.textContent?.trim() || "Humor";
      showToast(`Humor registrado: ${label}.`, "success");
      return;
    }

    const publishButton = event.target.closest(".feed-composer-submit");
    if (
      publishButton &&
      !publishButton.closest("#communication-admin-form") &&
      !publishButton.closest("#ldap-settings-form")
    ) {
      showToast("Publicacao mockada enviada para revisao do mural.", "success");
      return;
    }

    const composerAction = event.target.closest(".feed-action-chip");
    if (composerAction) {
      const label = composerAction.querySelector("span")?.textContent?.trim() || "Item";
      showToast(`${label} adicionado ao rascunho do post.`, "info");
      return;
    }

    const quickLink = event.target.closest(".quick-item");
    if (quickLink) {
      event.preventDefault();
      const label = quickLink.getAttribute("aria-label") || "Servico";
      showToast(`Abrindo ${label} em modo demonstrativo.`, "info");
      return;
    }

    const postAction = event.target.closest(".post-actions button");
    if (postAction) {
      const action = postAction.textContent?.trim() || "Acao";
      const author = postAction.dataset.postAuthor || "post";
      showToast(`${action} registrado no conteudo de ${author}.`, "success");
      return;
    }
  });
}
