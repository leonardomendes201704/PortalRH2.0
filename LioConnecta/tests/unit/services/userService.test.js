import test from "node:test";
import assert from "node:assert/strict";

import { getUserHomeContext } from "../../../assets/js/services/userService.js";

test("userService retorna view model mapeado a partir do JSON", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        brand: { name: "Empresa Y" },
        user: { name: "Roberta" }
      };
    }
  });

  try {
    const result = await getUserHomeContext();

    assert.equal(result.brand.name, "Empresa Y");
    assert.equal(result.user.name, "Roberta");
    assert.equal(result.hero.title, "Bem-vindo à LIOCONNECTA!");
  } finally {
    global.fetch = originalFetch;
  }
});
