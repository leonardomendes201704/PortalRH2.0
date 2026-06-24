import { getJson } from "./apiClient.js";
import { resolveApiEndpoint } from "../core/runtimeConfig.js";
import { getPortalAuthHeaders } from "./portalAuthService.js";

function normalizeAgendaPayload(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  return {
    date: payload.date || "",
    totalCount: Number(payload.totalCount ?? items.length) || 0,
    items: items.map((item) => ({
      id: String(item.id || ""),
      title: String(item.title || ""),
      description: String(item.description || ""),
      location: String(item.location || ""),
      timeLabel: String(item.timeLabel || ""),
      source: String(item.source || ""),
      audience: String(item.audience || ""),
      startAtUtc: String(item.startAtUtc || ""),
      endAtUtc: String(item.endAtUtc || "")
    })).filter((item) => item.title)
  };
}

export async function getAgendaDayData() {
  const payload = await getJson(resolveApiEndpoint("agenda"), {
    headers: getPortalAuthHeaders()
  });

  return normalizeAgendaPayload(payload);
}

export function applyAgendaToShellData(data, agenda) {
  const normalized = normalizeAgendaPayload(agenda);

  return {
    ...data,
    rightPanels: (data.rightPanels || []).map((panel) => {
      if (panel.title !== "AGENDA DO DIA") {
        return panel;
      }

      return {
        ...panel,
        items: normalized.items.map((item) => ({
          label: `${item.timeLabel} • ${item.title}`,
          description: item.location || item.description || "Compromisso corporativo"
        }))
      };
    }),
    agenda: normalized
  };
}
