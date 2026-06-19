import test from "node:test";
import assert from "node:assert/strict";

import { getCommunicationCenterData } from "../../../assets/js/services/communicationService.js";

test("communicationService retorna central de comunicados normalizada", async () => {
  const originalFetch = global.fetch;
  const payloads = new Map([
    ["http://localhost:5001/api/communications", [
      {
        slug: "destaque-da-semana",
        category: "RH",
        priority: "Alta prioridade",
        title: "Destaque da semana",
        summary: "Resumo 1",
        body: "Parágrafo 1\nParágrafo 2",
        audience: "Toda a companhia",
        channel: "Portal",
        status: "Publicado",
        attachmentLabel: "Abrir",
        owner: "RH",
        imageUrl: "./banner.png",
        isFeatured: true,
        publishedAt: "2026-06-19T09:00:00Z",
        updatedAtUtc: "2026-06-19T10:00:00Z"
      },
      {
        slug: "comunicado-1",
        category: "RH",
        priority: "Comunicado",
        title: "Comunicado 1",
        summary: "Resumo secundário",
        body: "Texto",
        audience: "Gestores",
        channel: "Portal + email",
        status: "Publicado",
        attachmentLabel: "Ver mais",
        owner: "RH",
        imageUrl: "",
        isFeatured: false,
        publishedAt: "2026-06-18T09:00:00Z",
        updatedAtUtc: "2026-06-18T10:00:00Z"
      }
    ]]
  ]);

  global.fetch = async (url) => ({
    ok: true,
    async json() {
      return payloads.get(url);
    }
  });

  try {
    const result = await getCommunicationCenterData();

    assert.equal(result.title, "CENTRAL DE COMUNICACAO OFICIAL");
    assert.equal(result.intro.title, "Todos os comunicados oficiais em um unico lugar");
    assert.equal(result.featured, null);
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].title, "Destaque da semana");
    assert.equal(result.items[1].title, "Comunicado 1");
    assert.equal(result.kpis[0].value, "2");
    assert.equal(result.filters[0].count, 2);
    assert.equal(result.loadError, "");
  } finally {
    global.fetch = originalFetch;
  }
});
