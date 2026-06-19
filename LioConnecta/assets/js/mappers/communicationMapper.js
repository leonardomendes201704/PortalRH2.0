import {
  DEFAULT_COMMUNICATIONS_CENTER,
  DEFAULT_COMMUNICATION_FILTERS,
  DEFAULT_COMMUNICATION_ITEMS
} from "../view-models/defaults.js";
import { asArray, asBoolean, asString } from "./shared.js";

function mapKpi(item, index) {
  return {
    label: asString(item?.label, `Indicador ${index + 1}`),
    value: asString(item?.value, "0"),
    detail: asString(item?.detail, ""),
    tone: asString(item?.tone, "brand")
  };
}

function mapFilter(item, index) {
  return {
    label: asString(item?.label, `Filtro ${index + 1}`),
    count: Number(item?.count ?? 0) || 0,
    active: asBoolean(item?.active, false)
  };
}

function mapCommunicationItem(item, index) {
  return {
    slug: asString(item?.slug, `comunicado-${index + 1}`),
    category: asString(item?.category, "Corporativo"),
    priority: asString(item?.priority, "Comunicado"),
    title: asString(item?.title, `Comunicado ${index + 1}`),
    summary: asString(item?.summary, "Resumo nao informado."),
    publishedAt: asString(item?.publishedAt, ""),
    audience: asString(item?.audience, ""),
    channel: asString(item?.channel, ""),
    status: asString(item?.status, ""),
    attachmentLabel: asString(item?.attachmentLabel, "Abrir"),
    body: asArray(item?.body).map((paragraph) => asString(paragraph)).filter(Boolean),
    image: asString(item?.image, ""),
    imageAlt: asString(item?.imageAlt, "")
  };
}

export function mapCommunicationCenterViewModel(raw = {}) {
  const fallback = DEFAULT_COMMUNICATIONS_CENTER;
  const rawItems = asArray(raw.items);

  return {
    title: asString(raw.title, fallback.title),
    intro: {
      eyebrow: asString(raw.intro?.eyebrow, fallback.intro.eyebrow),
      title: asString(raw.intro?.title, fallback.intro.title),
      subtitle: asString(raw.intro?.subtitle, fallback.intro.subtitle),
      lastUpdated: asString(raw.intro?.lastUpdated, fallback.intro.lastUpdated)
    },
    kpis: asArray(raw.kpis).map(mapKpi),
    filters: asArray(raw.filters).length
      ? asArray(raw.filters).map(mapFilter)
      : DEFAULT_COMMUNICATION_FILTERS.map((item) => ({ ...item })),
    featured: raw.featured
      ? {
        slug: asString(raw.featured?.slug, fallback.featured.slug),
        category: asString(raw.featured?.category, fallback.featured.category),
        priority: asString(raw.featured?.priority, fallback.featured.priority),
        title: asString(raw.featured?.title, fallback.featured.title),
        summary: asString(raw.featured?.summary, fallback.featured.summary),
        publishedAt: asString(raw.featured?.publishedAt, fallback.featured.publishedAt),
        audience: asString(raw.featured?.audience, fallback.featured.audience),
        owner: asString(raw.featured?.owner, fallback.featured.owner),
        channel: asString(raw.featured?.channel, fallback.featured.channel),
        status: asString(raw.featured?.status, fallback.featured.status),
        attachmentLabel: asString(raw.featured?.attachmentLabel, fallback.featured.attachmentLabel),
        image: asString(raw.featured?.image, fallback.featured.image),
        imageAlt: asString(raw.featured?.imageAlt, fallback.featured.imageAlt),
        body: asArray(raw.featured?.body).map((paragraph) => asString(paragraph)).filter(Boolean)
      }
      : null,
    items: rawItems.length ? rawItems.map(mapCommunicationItem) : []
  };
}
