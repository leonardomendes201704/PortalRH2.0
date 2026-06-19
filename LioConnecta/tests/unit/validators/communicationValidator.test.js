import test from "node:test";
import assert from "node:assert/strict";

import { validateCommunicationContract } from "../../../assets/js/validators/communicationValidator.js";

test("communicationValidator aceita contrato valido", () => {
  const result = validateCommunicationContract({
    title: "Central",
    intro: {
      title: "Comunicados"
    },
    featured: {
      title: "Destaque"
    },
    items: [
      {
        title: "Comunicado",
        summary: "Resumo"
      }
    ]
  });

  assert.equal(result.title, "Central");
});

test("communicationValidator rejeita items invalidos", () => {
  assert.throws(
    () => validateCommunicationContract({
      title: "Central",
      items: {}
    }),
    /items deve ser um array/
  );
});
