import test from "node:test";
import assert from "node:assert/strict";

import { getFeedData } from "../../../assets/js/services/feedService.js";

test("feedService consome envelope de dados em modo local", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  global.window = {
    location: { search: "?dataMode=local" },
    localStorage: {
      getItem() {
        return null;
      }
    }
  };

  global.fetch = async (url) => ({
    ok: true,
    async json() {
      assert.equal(url, "./local-api/feed.json");

      return {
        data: {
          posts: [
            {
              author: "Ana",
              text: "Modo local ativo"
            }
          ]
        }
      };
    }
  });

  try {
    const result = await getFeedData();
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0].author, "Ana");
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});
