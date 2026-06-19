import { ensureArray, ensureObject, ensureString, isObject, throwIfInvalid } from "./shared.js";

export function validateCarouselContract(raw) {
  const issues = [];

  if (!ensureObject("carousel", raw, issues)) {
    throwIfInvalid("carousel", issues);
  }

  ensureString(raw.title, issues, "title");

  if (raw.slides !== undefined && ensureArray("carousel", raw.slides, issues, "slides")) {
    raw.slides.forEach((slide, index) => {
      if (!isObject(slide)) {
        issues.push(`slides[${index}] deve ser um objeto`);
        return;
      }

      ensureString(slide.src, issues, `slides[${index}].src`, { required: true });
      ensureString(slide.alt, issues, `slides[${index}].alt`);
      ensureString(slide.href, issues, `slides[${index}].href`);
    });
  }

  throwIfInvalid("carousel", issues);
  return raw;
}
