import { createCommunication } from "../services/communicationService.js";
import { getAdminAuthHeaders, logoutAdmin, redirectToAdminLogin } from "../services/adminAuthService.js";
import { saveLdapSettings } from "../services/ldapSettingsService.js";
import { updatePortalUserPermission, updatePortalUserRole, updatePortalUserStatus } from "../services/portalUsersAdminService.js";

let feedbackBound = false;
let selectedImageDataUrl = "";

function notifyPortalUsersRefresh(message = "", tone = "success", options = {}) {
  document.dispatchEvent(new CustomEvent("portal-users:refresh", {
    detail: {
      message,
      tone,
      preserveModalUserId: options.preserveModalUserId || "",
      preserveModalMode: options.preserveModalMode || "edit"
    }
  }));
}

function getCurrentHashOrDefault(defaultHash = "#comunicacao/restrita") {
  return window.location.hash || defaultHash;
}

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
    const permissionSelect = event.target.closest("[data-action='update-portal-user-permission']");
    if (permissionSelect) {
      const userId = permissionSelect.getAttribute("data-user-id") || "";
      const userName = permissionSelect.getAttribute("data-user-name") || "Usuario";
      const moduleLabel = permissionSelect.getAttribute("data-module-label") || "Modulo";
      const moduleKey = permissionSelect.getAttribute("data-module-key") || "";
      const previousAccessLevel = permissionSelect.getAttribute("data-access-level") || "";
      const nextAccessLevel = permissionSelect.value;

      if (!userId || !moduleKey || !nextAccessLevel) {
        showToast("Nao foi possivel identificar a permissao selecionada.", "danger");
        return;
      }

      const isInsideModal = Boolean(permissionSelect.closest("#portal-user-modal"));
      permissionSelect.disabled = true;

      updatePortalUserPermission(userId, moduleKey, nextAccessLevel, {
        headers: getAdminAuthHeaders()
      })
        .then((updatedUser) => {
          permissionSelect.setAttribute("data-access-level", nextAccessLevel);
          notifyPortalUsersRefresh(`Permissao de ${moduleLabel} para ${userName} atualizada.`, "success", {
            preserveModalUserId: isInsideModal ? updatedUser.id : "",
            preserveModalMode: isInsideModal ? "edit" : "view"
          });
        })
        .catch((error) => {
          console.error("Falha ao atualizar permissao modular do usuario do portal.", error);
          permissionSelect.value = previousAccessLevel;

          const message = error instanceof Error && error.message.includes("HTTP 401")
            ? "Sua sessao administrativa expirou. Faca login novamente para continuar."
            : error instanceof Error && error.message.includes("HTTP 403")
              ? "Apenas o super-admin pode alterar permissoes por modulo."
              : "Nao foi possivel atualizar a permissao deste modulo agora.";

          showToast(message, "danger");

          if (error instanceof Error && error.message.includes("HTTP 401")) {
            window.setTimeout(() => {
              redirectToAdminLogin(getCurrentHashOrDefault("#admin/usuarios"));
            }, 700);
          }
        })
        .finally(() => {
          permissionSelect.disabled = false;
        });

      return;
    }

    const roleSelect = event.target.closest("[data-action='update-portal-user-role']");
    if (roleSelect) {
      const userId = roleSelect.getAttribute("data-user-id") || "";
      const userName = roleSelect.getAttribute("data-user-name") || "Usuario";
      const previousRole = roleSelect.getAttribute("data-user-role") || "";
      const nextRole = roleSelect.value;

      if (!userId || !nextRole) {
        showToast("Nao foi possivel identificar o perfil selecionado.", "danger");
        return;
      }

      const isInsideModal = Boolean(roleSelect.closest("#portal-user-modal"));
      roleSelect.disabled = true;

      updatePortalUserRole(userId, nextRole, {
        headers: getAdminAuthHeaders()
      })
        .then((updatedUser) => {
          roleSelect.setAttribute("data-user-role", nextRole);
          notifyPortalUsersRefresh(`Perfil de ${userName} atualizado com sucesso.`, "success", {
            preserveModalUserId: isInsideModal ? updatedUser.id : "",
            preserveModalMode: isInsideModal ? "edit" : "view"
          });
        })
        .catch((error) => {
          console.error("Falha ao atualizar perfil do usuario do portal.", error);
          roleSelect.value = previousRole;

          const message = error instanceof Error && error.message.includes("HTTP 401")
            ? "Sua sessao administrativa expirou. Faca login novamente para continuar."
            : error instanceof Error && error.message.includes("HTTP 403")
              ? "Apenas o super-admin pode alterar perfis de acesso."
              : "Nao foi possivel atualizar o perfil do usuario agora.";

          showToast(message, "danger");

          if (error instanceof Error && error.message.includes("HTTP 401")) {
            window.setTimeout(() => {
              redirectToAdminLogin(getCurrentHashOrDefault("#admin/usuarios"));
            }, 700);
          }
        })
        .finally(() => {
          roleSelect.disabled = false;
        });

      return;
    }

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
          : "Nao foi possivel publicar o comunicado agora. Verifique se a API do ambiente esta ativa.";

        showToast(message, "danger");

        if (error instanceof Error && error.message.includes("HTTP 401")) {
          window.setTimeout(() => {
            redirectToAdminLogin(getCurrentHashOrDefault());
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
            redirectToAdminLogin(getCurrentHashOrDefault("#configuracoes"));
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

  root.addEventListener("click", async (event) => {
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
        redirectToAdminLogin(getCurrentHashOrDefault());
      });
      return;
    }

    const userStatusToggle = event.target.closest("[data-action='toggle-portal-user-status']");
    if (userStatusToggle) {
      event.preventDefault();

      const userId = userStatusToggle.getAttribute("data-user-id") || "";
      const userName = userStatusToggle.getAttribute("data-user-name") || "Usuario";
      const isCurrentlyActive = userStatusToggle.getAttribute("data-user-active") === "true";
      const nextStatus = !isCurrentlyActive;
      const originalLabel = userStatusToggle.textContent;

      if (!userId) {
        showToast("Nao foi possivel identificar o usuario selecionado.", "danger");
        return;
      }

      const isInsideModal = Boolean(userStatusToggle.closest("#portal-user-modal"));
      userStatusToggle.disabled = true;
      userStatusToggle.textContent = nextStatus ? "Reativando..." : "Desativando...";

      try {
        const updatedUser = await updatePortalUserStatus(userId, nextStatus, {
          headers: getAdminAuthHeaders()
        });

        notifyPortalUsersRefresh(
          `${userName} ${nextStatus ? "reativado" : "desativado"} com sucesso.`,
          "success",
          {
            preserveModalUserId: isInsideModal ? updatedUser.id : "",
            preserveModalMode: isInsideModal ? "edit" : "view"
          }
        );
      } catch (error) {
        console.error("Falha ao atualizar status do usuario do portal.", error);

        const message = error instanceof Error && error.message.includes("HTTP 401")
          ? "Sua sessao administrativa expirou. Faca login novamente para continuar."
          : error instanceof Error && error.message.includes("HTTP 403")
            ? "Apenas o super-admin pode alterar o status de usuarios."
            : "Nao foi possivel atualizar o status do usuario agora.";

        showToast(message, "danger");

        if (error instanceof Error && error.message.includes("HTTP 401")) {
          window.setTimeout(() => {
            redirectToAdminLogin(getCurrentHashOrDefault("#admin/usuarios"));
          }, 700);
        }
      } finally {
        userStatusToggle.disabled = false;
        userStatusToggle.textContent = originalLabel || (nextStatus ? "Reativar acesso" : "Desativar acesso");
      }

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
