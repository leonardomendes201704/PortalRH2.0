import test from "node:test";
import assert from "node:assert/strict";

import { getFeedData } from "../../../assets/js/services/feedService.js";
import { ContractValidationError } from "../../../assets/js/validators/validationError.js";

test("service propaga erro de contrato inválido", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        posts: [
          {
            author: "Ana",
            text: "Post",
            reactions: "abc"
          }
        ]
      };
    }
  });

  try {
    await assert.rejects(() => getFeedData(), ContractValidationError);
  } finally {
    global.fetch = originalFetch;
  }
});
