import { getJson } from "./apiClient.js";
import { unwrapDataEnvelope } from "./apiClient.js";
import { mapPanelViewModel } from "../mappers/panelMapper.js";
import { validatePanelContract } from "../validators/panelValidator.js";
import { getRuntimeConfig, resolveDataSource, usesEnvelope } from "../core/runtimeConfig.js";

export async function getPanelData() {
  const config = getRuntimeConfig();
  const rawPayload = await getJson(resolveDataSource("panels"));
  const raw = usesEnvelope(config.dataMode) ? unwrapDataEnvelope(rawPayload) : rawPayload;
  validatePanelContract(raw);
  return mapPanelViewModel(raw);
}
