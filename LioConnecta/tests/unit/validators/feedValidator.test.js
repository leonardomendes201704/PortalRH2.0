import test from "node:test";
import assert from "node:assert/strict";

import { validateFeedContract } from "../../../assets/js/validators/feedValidator.js";
import { ContractValidationError } from "../../../assets/js/validators/validationError.js";

test("feedValidator aceita feed válido", () => {
  assert.doesNotThrow(() => {
    validateFeedContract({
      title: "Feed",
      posts: [
        {
          author: "Ana",
          text: "Post",
          reactions: 1,
          commentsCount: 2,
          sharesCount: 3,
          comments: [{ author: "Leo", text: "Ok" }]
        }
      ]
    });
  });
});

test("feedValidator rejeita métricas inválidas", () => {
  assert.throws(() => {
    validateFeedContract({
      posts: [
        {
          author: "Ana",
          text: "Post",
          reactions: "abc"
        }
      ]
    });
  }, ContractValidationError);
});
