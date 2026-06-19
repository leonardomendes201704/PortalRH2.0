import test from "node:test";
import assert from "node:assert/strict";

import { validateCarouselContract } from "../../../assets/js/validators/carouselValidator.js";
import { ContractValidationError } from "../../../assets/js/validators/validationError.js";

test("carouselValidator aceita slides válidos", () => {
  assert.doesNotThrow(() => {
    validateCarouselContract({
      title: "Destaques",
      slides: [{ src: "./banner.png", alt: "Banner" }]
    });
  });
});

test("carouselValidator exige src do slide", () => {
  assert.throws(() => {
    validateCarouselContract({
      slides: [{ alt: "Sem imagem" }]
    });
  }, ContractValidationError);
});
