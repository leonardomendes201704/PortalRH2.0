import { getJson } from "./apiClient.js";
import { unwrapDataEnvelope } from "./apiClient.js";
import { mapPanelViewModel } from "../mappers/panelMapper.js";
import { validatePanelContract } from "../validators/panelValidator.js";
import { getRuntimeConfig, resolveDataSource, usesEnvelope } from "../core/runtimeConfig.js";
import { getStoredPortalSession } from "./portalAuthService.js";

export async function getPanelData() {
  const config = getRuntimeConfig();
  const rawPayload = await getJson(resolveDataSource("panels"));
  const raw = usesEnvelope(config.dataMode) ? unwrapDataEnvelope(rawPayload) : rawPayload;
  validatePanelContract(raw);
  const viewModel = mapPanelViewModel(raw);
  const portalSession = getStoredPortalSession();

  if (!portalSession?.user) {
    return viewModel;
  }

  return {
    ...viewModel,
    rightPanels: viewModel.rightPanels.map((panel) => {
      if (panel.type !== "profile") {
        return panel;
      }

      return {
        ...panel,
        name: portalSession.user.displayName || panel.name,
        subtitle: portalSession.user.department || "",
        description: portalSession.user.title || "",
        manager: portalSession.user.managerDisplayName || ""
      };
    })
  };
}
