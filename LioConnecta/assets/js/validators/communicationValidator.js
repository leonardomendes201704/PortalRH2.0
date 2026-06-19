import {
  ensureArray,
  ensureObject,
  ensureString,
  isObject,
  throwIfInvalid
} from "./shared.js";

export function validateCommunicationContract(raw) {
  const issues = [];

  if (!ensureObject("communications", raw, issues)) {
    throwIfInvalid("communications", issues);
  }

  ensureString(raw.title, issues, "title");

  if (raw.intro !== undefined && ensureObject("communications", raw.intro, issues, "intro")) {
    ensureString(raw.intro.eyebrow, issues, "intro.eyebrow");
    ensureString(raw.intro.title, issues, "intro.title");
    ensureString(raw.intro.subtitle, issues, "intro.subtitle");
    ensureString(raw.intro.lastUpdated, issues, "intro.lastUpdated");
  }

  if (raw.kpis !== undefined && ensureArray("communications", raw.kpis, issues, "kpis")) {
    raw.kpis.forEach((item, index) => {
      if (!isObject(item)) {
        issues.push(`kpis[${index}] deve ser um objeto`);
        return;
      }

      ensureString(item.label, issues, `kpis[${index}].label`);
      ensureString(item.value, issues, `kpis[${index}].value`);
      ensureString(item.detail, issues, `kpis[${index}].detail`);
      ensureString(item.tone, issues, `kpis[${index}].tone`);
    });
  }

  if (raw.filters !== undefined && ensureArray("communications", raw.filters, issues, "filters")) {
    raw.filters.forEach((item, index) => {
      if (!isObject(item)) {
        issues.push(`filters[${index}] deve ser um objeto`);
        return;
      }

      ensureString(item.label, issues, `filters[${index}].label`);
    });
  }

  if (raw.featured !== undefined && ensureObject("communications", raw.featured, issues, "featured")) {
    ensureString(raw.featured.slug, issues, "featured.slug");
    ensureString(raw.featured.category, issues, "featured.category");
    ensureString(raw.featured.priority, issues, "featured.priority");
    ensureString(raw.featured.title, issues, "featured.title");
    ensureString(raw.featured.summary, issues, "featured.summary");
    ensureString(raw.featured.publishedAt, issues, "featured.publishedAt");
    ensureString(raw.featured.audience, issues, "featured.audience");
    ensureString(raw.featured.owner, issues, "featured.owner");
    ensureString(raw.featured.channel, issues, "featured.channel");
    ensureString(raw.featured.status, issues, "featured.status");
    ensureString(raw.featured.attachmentLabel, issues, "featured.attachmentLabel");
    ensureString(raw.featured.image, issues, "featured.image");
    ensureString(raw.featured.imageAlt, issues, "featured.imageAlt");

    if (raw.featured.body !== undefined && ensureArray("communications", raw.featured.body, issues, "featured.body")) {
      raw.featured.body.forEach((paragraph, index) => {
        ensureString(paragraph, issues, `featured.body[${index}]`);
      });
    }
  }

  if (raw.items !== undefined && ensureArray("communications", raw.items, issues, "items")) {
    raw.items.forEach((item, index) => {
      if (!isObject(item)) {
        issues.push(`items[${index}] deve ser um objeto`);
        return;
      }

      ensureString(item.slug, issues, `items[${index}].slug`);
      ensureString(item.category, issues, `items[${index}].category`);
      ensureString(item.priority, issues, `items[${index}].priority`);
      ensureString(item.title, issues, `items[${index}].title`);
      ensureString(item.summary, issues, `items[${index}].summary`);
      ensureString(item.publishedAt, issues, `items[${index}].publishedAt`);
      ensureString(item.audience, issues, `items[${index}].audience`);
      ensureString(item.channel, issues, `items[${index}].channel`);
      ensureString(item.status, issues, `items[${index}].status`);
      ensureString(item.attachmentLabel, issues, `items[${index}].attachmentLabel`);
      ensureString(item.image, issues, `items[${index}].image`);
      ensureString(item.imageAlt, issues, `items[${index}].imageAlt`);

      if (item.body !== undefined && ensureArray("communications", item.body, issues, `items[${index}].body`)) {
        item.body.forEach((paragraph, paragraphIndex) => {
          ensureString(paragraph, issues, `items[${index}].body[${paragraphIndex}]`);
        });
      }
    });
  }

  throwIfInvalid("communications", issues);
  return raw;
}
