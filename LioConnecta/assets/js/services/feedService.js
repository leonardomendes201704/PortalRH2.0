import { getJson } from "./apiClient.js";
import { unwrapDataEnvelope } from "./apiClient.js";
import { mapFeedViewModel } from "../mappers/feedMapper.js";
import { validateFeedContract } from "../validators/feedValidator.js";
import { getRuntimeConfig, resolveDataSource, usesEnvelope } from "../core/runtimeConfig.js";

export async function getFeedData() {
  const config = getRuntimeConfig();
  const rawPayload = await getJson(resolveDataSource("feed"));
  const raw = usesEnvelope(config.dataMode) ? unwrapDataEnvelope(rawPayload) : rawPayload;
  validateFeedContract(raw);
  return mapFeedViewModel(raw);
}
