import { DEFAULT_PANELS } from "../view-models/defaults.js";
import { asArray, asString } from "./shared.js";

function mapPanelItem(item) {
  if (typeof item === "string") {
    return item;
  }

  return {
    label: asString(item?.label, ""),
    badge: asString(item?.badge, ""),
    value: asString(item?.value, ""),
    className: asString(item?.className, ""),
    shortLabel: asString(item?.shortLabel, "")
  };
}

function mapGenericPanel(panel) {
  return {
    type: asString(panel?.type, ""),
    title: asString(panel?.title, "Painel"),
    name: asString(panel?.name, ""),
    subtitle: asString(panel?.subtitle, ""),
    items: asArray(panel?.items).map(mapPanelItem).filter((item) => {
      if (typeof item === "string") {
        return Boolean(item);
      }

      return Boolean(item.label || item.value || item.shortLabel);
    })
  };
}

export function mapPanelViewModel(raw = {}) {
  return {
    leftPanels: asArray(raw.leftPanels).length
      ? asArray(raw.leftPanels).map(mapGenericPanel)
      : [...DEFAULT_PANELS],
    rightPanels: asArray(raw.rightPanels).length
      ? asArray(raw.rightPanels).map(mapGenericPanel)
      : [...DEFAULT_PANELS]
  };
}
