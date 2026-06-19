import test from "node:test";
import assert from "node:assert/strict";

import { getPanelData } from "../../../assets/js/services/panelService.js";

test("panelService retorna leftPanels e rightPanels normalizados", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        leftPanels: [{ title: "Esquerda", items: [{ label: "A" }] }],
        rightPanels: [{ title: "Direita", items: [{ label: "B" }] }]
      };
    }
  });

  try {
    const result = await getPanelData();

    assert.equal(result.leftPanels[0].title, "Esquerda");
    assert.equal(result.rightPanels[0].title, "Direita");
  } finally {
    global.fetch = originalFetch;
  }
});
