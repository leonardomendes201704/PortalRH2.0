import { createCommunication } from "../services/communicationService.js";

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
    if (!form) {
      return;
    }

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
      });

      showToast(`Comunicado publicado com sucesso no backend local${publishedValue ? ` em ${formatAdminDate(publishedValue)}` : ""}.`, "success");
      window.setTimeout(() => {
        window.location.hash = "#comunicacao";
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Falha ao publicar comunicado na API.", error);
      showToast("Não foi possível publicar o comunicado agora. Verifique se a API está ativa em localhost:5001.", "danger");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonLabel || "Publicar comunicado";
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

    const moodButton = event.target.closest(".mood-option");
    if (moodButton) {
      const label = moodButton.querySelector("strong")?.textContent?.trim() || "Humor";
      showToast(`Humor registrado: ${label}.`, "success");
      return;
    }

    const publishButton = event.target.closest(".feed-composer-submit");
    if (publishButton) {
      showToast("Publicação mockada enviada para revisão do mural.", "success");
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
      const label = quickLink.getAttribute("aria-label") || "Serviço";
      showToast(`Abrindo ${label} em modo demonstrativo.`, "info");
      return;
    }

    const postAction = event.target.closest(".post-actions button");
    if (postAction) {
      const action = postAction.textContent?.trim() || "Ação";
      const author = postAction.dataset.postAuthor || "post";
      showToast(`${action} registrado no conteúdo de ${author}.`, "success");
      return;
    }
  });
}
