import test from "node:test";
import assert from "node:assert/strict";

import { APP_VERSION, getRuntimeConfig, resolveDataSource, usesEnvelope } from "../../../assets/js/core/runtimeConfig.js";

test("runtimeConfig usa mock por padrão", () => {
  const config = getRuntimeConfig();

  assert.equal(config.version, APP_VERSION);
  assert.equal(config.dataMode, "mock");
  assert.equal(resolveDataSource("feed"), "./assets/data/feed.json");
  assert.equal(resolveDataSource("communications"), "./assets/data/communications.json");
  assert.equal(usesEnvelope(config.dataMode), false);
});
