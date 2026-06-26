import { escapeHtml } from "./html.js";

const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
const SOURCE_LABELS = {
  "microsoft-365": "Microsoft 365",
  portal: "Portal RH",
  database: "Portal RH"
};

let agendaEvents = [];
let modalRoot = null;
let actionsBound = false;
let keydownBound = false;

function formatSourceLabel(source) {
  const normalized = String(source || "").trim().toLowerCase();
  return SOURCE_LABELS[normalized] || (source ? String(source) : "Agenda");
}

function formatDateTime(value, options) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIME_ZONE,
    ...options
  }).format(date);
}

function formatSchedule(event) {
  const startDate = formatDateTime(event.startAtUtc, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const startTime = formatDateTime(event.startAtUtc, {
    hour: "2-digit",
    minute: "2-digit"
  });
  const endTime = formatDateTime(event.endAtUtc, {
    hour: "2-digit",
    minute: "2-digit"
  });

  if (startDate && startTime && endTime) {
    return `${startDate}, ${startTime} - ${endTime}`;
  }

  if (event.timeLabel) {
    return event.timeLabel;
  }

  return startDate || "Horario nao informado";
}

function findAgendaEvent(eventId) {
  return agendaEvents.find((item) => String(item.id) === String(eventId)) || null;
}

function renderDetailRow(iconClass, label, value) {
  if (!value) {
    return "";
  }

  return `
    <div class="agenda-event-modal__row">
      <span class="agenda-event-modal__row-icon" aria-hidden="true">
        <i class="${escapeHtml(iconClass)}"></i>
      </span>
      <div class="agenda-event-modal__row-copy">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    </div>
  `;
}

function renderModalContent(event) {
  const description = event.detailDescription || event.description || "";
  const location = event.location && event.location !== description ? event.location : "";
  const schedule = formatSchedule(event);
  const source = formatSourceLabel(event.source);

  return `
    <div class="agenda-event-modal__content">
      <section class="agenda-event-modal__hero">
        <div class="agenda-event-modal__hero-icon" aria-hidden="true">
          <i class="fa-regular fa-calendar"></i>
        </div>
        <div class="agenda-event-modal__hero-copy">
          <strong>${escapeHtml(event.title)}</strong>
          <span>${escapeHtml(schedule)}</span>
        </div>
      </section>
      <section class="agenda-event-modal__details">
        ${renderDetailRow("fa-regular fa-clock", "Horario", schedule)}
        ${renderDetailRow("fa-solid fa-location-dot", "Local", location)}
        ${renderDetailRow("fa-solid fa-cloud", "Origem", source)}
        ${description ? `
          <div class="agenda-event-modal__description">
            <span>Descricao</span>
            <p>${escapeHtml(description)}</p>
          </div>
        ` : ""}
      </section>
    </div>
  `;
}

function renderModalShell(event) {
  return `
    <div class="agenda-event-modal" role="dialog" aria-modal="true" aria-labelledby="agenda-event-modal-title">
      <div class="agenda-event-modal__backdrop" data-action="close-agenda-event-modal"></div>
      <div class="agenda-event-modal__dialog card">
        <div class="card-header agenda-event-modal__header">
          <div class="agenda-event-modal__title-block">
            <strong id="agenda-event-modal-title">Detalhes do evento</strong>
            <span>${escapeHtml(event.title)}</span>
          </div>
          <button
            type="button"
            class="comm-tertiary-button agenda-event-modal__close"
            data-action="close-agenda-event-modal"
            aria-label="Fechar modal"
          >
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div class="agenda-event-modal__body">
          ${renderModalContent(event)}
        </div>
      </div>
    </div>
  `;
}

function closeModal() {
  if (modalRoot) {
    modalRoot.remove();
    modalRoot = null;
  }

  document.body.classList.remove("agenda-event-modal-open");
}

export function setAgendaEvents(events = []) {
  agendaEvents = Array.isArray(events) ? events.map((item) => ({ ...item })) : [];
}

export function openAgendaEventModal(eventId) {
  const event = findAgendaEvent(eventId);
  if (!event) {
    return;
  }

  closeModal();
  document.body.insertAdjacentHTML("beforeend", renderModalShell(event));
  modalRoot = document.querySelector(".agenda-event-modal");
  document.body.classList.add("agenda-event-modal-open");
  modalRoot?.querySelector("[data-action='close-agenda-event-modal']")?.focus();
}

function handleDocumentClick(event) {
  const trigger = event.target.closest("[data-action='open-agenda-event-modal']");
  if (trigger) {
    event.preventDefault();
    openAgendaEventModal(trigger.dataset.agendaId);
    return;
  }

  if (event.target.closest("[data-action='close-agenda-event-modal']")) {
    event.preventDefault();
    closeModal();
  }
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape" && modalRoot) {
    event.preventDefault();
    closeModal();
  }
}

export function bindAgendaEventModalActions() {
  if (!actionsBound) {
    actionsBound = true;
    document.addEventListener("click", handleDocumentClick);
  }

  if (!keydownBound) {
    keydownBound = true;
    document.addEventListener("keydown", handleDocumentKeydown);
  }
}
