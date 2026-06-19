import { getJson } from "./apiClient.js";
import { unwrapDataEnvelope } from "./apiClient.js";
import { mapUserHomeContextViewModel } from "../mappers/userMapper.js";
import { validateUserContract } from "../validators/userValidator.js";
import { getRuntimeConfig, resolveDataSource, usesEnvelope } from "../core/runtimeConfig.js";

export async function getUserHomeContext() {
  const config = getRuntimeConfig();
  const rawPayload = await getJson(resolveDataSource("user"));
  const raw = usesEnvelope(config.dataMode) ? unwrapDataEnvelope(rawPayload) : rawPayload;
  validateUserContract(raw);
  return mapUserHomeContextViewModel(raw);
}
