export class ContractValidationError extends Error {
  constructor(domain, issues) {
    super(`Contrato inválido em ${domain}: ${issues.join("; ")}`);
    this.name = "ContractValidationError";
    this.domain = domain;
    this.issues = issues;
  }
}
