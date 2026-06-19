import { getJson } from "./apiClient.js";
import { unwrapDataEnvelope } from "./apiClient.js";
import { mapUserHomeContextViewModel } from "../mappers/userMapper.js";
import { validateUserContract } from "../validators/userValidator.js";
import { getRuntimeConfig, resolveDataSource, usesEnvelope } from "../core/runtimeConfig.js";
import { getStoredPortalSession } from "./portalAuthService.js";

export async function getUserHomeContext() {
  const config = getRuntimeConfig();
  const rawPayload = await getJson(resolveDataSource("user"));
  const raw = usesEnvelope(config.dataMode) ? unwrapDataEnvelope(rawPayload) : rawPayload;
  validateUserContract(raw);
  const viewModel = mapUserHomeContextViewModel(raw);
  const portalSession = getStoredPortalSession();

  if (!portalSession?.user) {
    return viewModel;
  }

  return {
    ...viewModel,
    user: {
      ...viewModel.user,
      name: portalSession.user.displayName || viewModel.user.name,
      area: portalSession.user.department || viewModel.user.area
    }
  };
}
