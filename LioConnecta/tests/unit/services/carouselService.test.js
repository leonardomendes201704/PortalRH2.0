import test from "node:test";
import assert from "node:assert/strict";

import { getCarouselData } from "../../../assets/js/services/carouselService.js";

test("carouselService retorna slides normalizados", async () => {
  const originalFetch = global.fetch;
  const payloads = new Map([
    ["http://localhost:5001/api/communications", [
      {
        slug: "comunicado-destaque",
        title: "Comunicado principal",
        imageUrl: "./banner-api.png",
        publishedAt: "2026-06-19T09:00:00Z"
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
    const result = await getCarouselData();

    assert.equal(result.title, "COMUNICACAO CENTRALIZADA");
    assert.equal(result.slides.length, 1);
    assert.equal(result.slides[0].alt, "Comunicado principal");
  } finally {
    global.fetch = originalFetch;
  }
});

test("carouselService preserva href vindo do payload", async () => {
  const originalFetch = global.fetch;
  const payloads = new Map([
    ["http://localhost:5001/api/communications", [
      {
        slug: "exemplo",
        title: "Comunicado exemplo",
        imageUrl: "./banner.png",
        publishedAt: "2026-06-19T09:00:00Z"
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
    const result = await getCarouselData();
    assert.equal(result.slides[0].href, "#comunicacao/leitura/exemplo");
  } finally {
    global.fetch = originalFetch;
  }
});
