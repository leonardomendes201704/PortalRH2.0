const STORAGE_KEY = "lioconnecta.analytics";

function readEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-100)));
}

export function trackInteraction(name, detail = {}) {
  const events = readEvents();
  const payload = {
    name,
    detail,
    timestamp: new Date().toISOString()
  };

  events.push(payload);
  writeEvents(events);
  console.info("[LIOCONNECTA analytics]", payload);
}

export function bindAnalytics(root = document) {
  root.querySelectorAll("[data-analytics]").forEach((element) => {
    element.addEventListener("click", () => {
      trackInteraction(element.dataset.analytics, {
        label: element.dataset.analyticsLabel ?? element.textContent.trim()
      });
    });
  });
}
