import { ensureArray, ensureNumberLike, ensureObject, ensureString, isObject, throwIfInvalid } from "./shared.js";

function validatePanelItem(item, issues, labelPrefix) {
  if (typeof item === "string") {
    return;
  }

  if (!isObject(item)) {
    issues.push(`${labelPrefix} deve ser texto ou objeto`);
    return;
  }

  ensureString(item.label, issues, `${labelPrefix}.label`);
  ensureString(item.badge, issues, `${labelPrefix}.badge`);
  ensureString(item.value, issues, `${labelPrefix}.value`);
  ensureString(item.className, issues, `${labelPrefix}.className`);
  ensureString(item.shortLabel, issues, `${labelPrefix}.shortLabel`);
  ensureNumberLike(item.badge, issues, `${labelPrefix}.badge`);
}

function validatePanel(panel, issues, labelPrefix) {
  if (!isObject(panel)) {
    issues.push(`${labelPrefix} deve ser um objeto`);
    return;
  }

  ensureString(panel.type, issues, `${labelPrefix}.type`);
  ensureString(panel.title, issues, `${labelPrefix}.title`);
  ensureString(panel.name, issues, `${labelPrefix}.name`);
  ensureString(panel.subtitle, issues, `${labelPrefix}.subtitle`);

  if (panel.items !== undefined && ensureArray("panels", panel.items, issues, `${labelPrefix}.items`)) {
    panel.items.forEach((item, index) => validatePanelItem(item, issues, `${labelPrefix}.items[${index}]`));
  }
}

export function validatePanelContract(raw) {
  const issues = [];

  if (!ensureObject("panels", raw, issues)) {
    throwIfInvalid("panels", issues);
  }

  if (raw.leftPanels !== undefined && ensureArray("panels", raw.leftPanels, issues, "leftPanels")) {
    raw.leftPanels.forEach((panel, index) => validatePanel(panel, issues, `leftPanels[${index}]`));
  }

  if (raw.rightPanels !== undefined && ensureArray("panels", raw.rightPanels, issues, "rightPanels")) {
    raw.rightPanels.forEach((panel, index) => validatePanel(panel, issues, `rightPanels[${index}]`));
  }

  throwIfInvalid("panels", issues);
  return raw;
}
