import test from "node:test";
import assert from "node:assert/strict";

import { mapPanelViewModel } from "../../../assets/js/mappers/panelMapper.js";

test("panelMapper normaliza painéis de menu e profile", () => {
  const result = mapPanelViewModel({
    leftPanels: [
      { title: "Menu", items: [{ label: "Item 1", badge: "3" }] }
    ],
    rightPanels: [
      { type: "profile", title: "Perfil", name: "Roberto", items: ["Férias", "Dados"] }
    ]
  });

  assert.equal(result.leftPanels.length, 1);
  assert.equal(result.leftPanels[0].items[0].badge, "3");
  assert.equal(result.rightPanels[0].type, "profile");
  assert.equal(result.rightPanels[0].name, "Roberto");
  assert.deepEqual(result.rightPanels[0].items, ["Férias", "Dados"]);
});

test("panelMapper filtra itens vazios", () => {
  const result = mapPanelViewModel({
    leftPanels: [
      { title: "Indicadores", items: [{ label: "" }, { label: "Ativos", value: "4" }] }
    ],
    rightPanels: []
  });

  assert.equal(result.leftPanels[0].items.length, 1);
  assert.equal(result.leftPanels[0].items[0].label, "Ativos");
});
