import { getJson, putJson } from "./apiClient.js";
import { resolveApiEndpoint } from "../core/runtimeConfig.js";

const DEFAULT_LDAP_SETTINGS = Object.freeze({
  isEnabled: false,
  server: "",
  port: 389,
  useLdaps: false,
  useStartTls: false,
  ignoreCertificateValidation: false,
  baseDn: "",
  userSearchBase: "",
  netbiosDomain: "",
  loginFormat: "email-or-upn-or-samaccountname",
  bindDn: "",
  hasServiceAccountPassword: false,
  searchFilter: "(|(mail={0})(userPrincipalName={0})(sAMAccountName={0}))",
  displayNameAttribute: "displayName",
  updatedAtUtc: "",
  loadError: ""
});

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeSettings(payload = {}, loadError = "") {
  return {
    isEnabled: Boolean(payload.isEnabled),
    server: normalizeText(payload.server),
    port: Number(payload.port || 389) || 389,
    useLdaps: Boolean(payload.useLdaps),
    useStartTls: Boolean(payload.useStartTls),
    ignoreCertificateValidation: Boolean(payload.ignoreCertificateValidation),
    baseDn: normalizeText(payload.baseDn),
    userSearchBase: normalizeText(payload.userSearchBase),
    netbiosDomain: normalizeText(payload.netbiosDomain),
    loginFormat: normalizeText(payload.loginFormat, DEFAULT_LDAP_SETTINGS.loginFormat),
    bindDn: normalizeText(payload.bindDn),
    hasServiceAccountPassword: Boolean(payload.hasServiceAccountPassword),
    searchFilter: normalizeText(payload.searchFilter, DEFAULT_LDAP_SETTINGS.searchFilter),
    displayNameAttribute: normalizeText(payload.displayNameAttribute, DEFAULT_LDAP_SETTINGS.displayNameAttribute),
    updatedAtUtc: normalizeText(payload.updatedAtUtc),
    loadError
  };
}

function mapSavePayload(payload = {}) {
  return {
    isEnabled: Boolean(payload.isEnabled),
    server: normalizeText(payload.server),
    port: Number(payload.port || 389) || 389,
    useLdaps: Boolean(payload.useLdaps),
    useStartTls: Boolean(payload.useStartTls),
    ignoreCertificateValidation: Boolean(payload.ignoreCertificateValidation),
    baseDn: normalizeText(payload.baseDn),
    userSearchBase: normalizeText(payload.userSearchBase),
    netbiosDomain: normalizeText(payload.netbiosDomain),
    loginFormat: normalizeText(payload.loginFormat, DEFAULT_LDAP_SETTINGS.loginFormat),
    bindDn: normalizeText(payload.bindDn),
    serviceAccountPassword: String(payload.serviceAccountPassword || ""),
    searchFilter: normalizeText(payload.searchFilter, DEFAULT_LDAP_SETTINGS.searchFilter),
    displayNameAttribute: normalizeText(payload.displayNameAttribute, DEFAULT_LDAP_SETTINGS.displayNameAttribute)
  };
}

export async function getLdapSettingsData(options = {}) {
  try {
    const payload = await getJson(resolveApiEndpoint("adminLdap"), options);
    return normalizeSettings(payload);
  } catch (error) {
    console.error("Falha ao carregar configuracao LDAP.", error);
    return normalizeSettings(DEFAULT_LDAP_SETTINGS, "Nao foi possivel carregar a configuracao LDAP persistida.");
  }
}

export async function saveLdapSettings(payload = {}, options = {}) {
  const response = await putJson(resolveApiEndpoint("adminLdap"), mapSavePayload(payload), options);
  return normalizeSettings(response);
}
