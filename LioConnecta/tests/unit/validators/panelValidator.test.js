import test from "node:test";
import assert from "node:assert/strict";

import { validatePanelContract } from "../../../assets/js/validators/panelValidator.js";
import { ContractValidationError } from "../../../assets/js/validators/validationError.js";

test("panelValidator aceita painéis válidos", () => {
  assert.doesNotThrow(() => {
    validatePanelContract({
      leftPanels: [{ title: "Painel", items: [{ label: "Item", badge: "2" }] }],
      rightPanels: [{ type: "profile", title: "Perfil", name: "Roberto", items: ["Férias"] }]
    });
  });
});

test("panelValidator rejeita leftPanels não array", () => {
  assert.throws(() => {
    validatePanelContract({
      leftPanels: {}
    });
  }, ContractValidationError);
});
