import { ContractValidationError } from "./validationError.js";

export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isNumberLike(value) {
  return typeof value === "number" || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)));
}

export function ensureObject(domain, value, issues, label = "root") {
  if (!isObject(value)) {
    issues.push(`${label} deve ser um objeto`);
    return false;
  }

  return true;
}

export function ensureArray(domain, value, issues, label) {
  if (!Array.isArray(value)) {
    issues.push(`${label} deve ser um array`);
    return false;
  }

  return true;
}

export function ensureString(value, issues, label, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      issues.push(`${label} é obrigatório`);
    }
    return;
  }

  if (typeof value !== "string") {
    issues.push(`${label} deve ser texto`);
  }
}

export function ensureBoolean(value, issues, label) {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "boolean") {
    issues.push(`${label} deve ser boolean`);
  }
}

export function ensureNumberLike(value, issues, label) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (!isNumberLike(value)) {
    issues.push(`${label} deve ser numérico`);
  }
}

export function throwIfInvalid(domain, issues) {
  if (issues.length > 0) {
    throw new ContractValidationError(domain, issues);
  }
}
