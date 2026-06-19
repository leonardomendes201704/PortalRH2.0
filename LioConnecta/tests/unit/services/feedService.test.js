import test from "node:test";
import assert from "node:assert/strict";

import { getFeedData } from "../../../assets/js/services/feedService.js";

test("feedService entrega feed já normalizado", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        posts: [
          {
            author: "Joana",
            text: "Post válido",
            reactions: "9",
            comments: [{ author: "Lucas", text: "Boa!" }]
          }
        ]
      };
    }
  });

  try {
    const result = await getFeedData();

    assert.equal(result.title, "FEED LIOCONNECTA");
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0].reactions, 9);
    assert.equal(result.posts[0].comments[0].author, "Lucas");
  } finally {
    global.fetch = originalFetch;
  }
});
