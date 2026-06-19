import test from "node:test";
import assert from "node:assert/strict";

import { validateUserContract } from "../../../assets/js/validators/userValidator.js";
import { ContractValidationError } from "../../../assets/js/validators/validationError.js";

test("userValidator aceita contrato válido", () => {
  assert.doesNotThrow(() => {
    validateUserContract({
      brand: { name: "LIOCONNECTA", tagline: "Capacidade" },
      user: { name: "Roberto", greeting: "Olá," },
      navItems: [{ label: "INÍCIO", active: true }]
    });
  });
});

test("userValidator rejeita navItems inválido", () => {
  assert.throws(() => {
    validateUserContract({
      navItems: [{}]
    });
  }, ContractValidationError);
});
