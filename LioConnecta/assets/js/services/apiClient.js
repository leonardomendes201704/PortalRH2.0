export async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
  }

  return response.json();
}

export async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Falha ao publicar em ${url}: HTTP ${response.status}`);
  }

  return response.json();
}

export function unwrapDataEnvelope(payload, { fallback = {} } = {}) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? fallback;
  }

  return payload ?? fallback;
}
