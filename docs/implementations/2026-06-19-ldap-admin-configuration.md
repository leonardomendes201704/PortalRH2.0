# 2026-06-19 - Configuracao LDAP no admin

## Objetivo

Adicionar na area administrativa restrita da LIOCONNECTA uma tela para configuracao e persistencia dos parametros de Active Directory / LDAP, preparando o caminho para o futuro login corporativo por e-mail e senha.

## Entregas

- Modelo persistido no PostgreSQL para configuracao LDAP.
- Endpoint administrativo protegido para consultar e salvar configuracao LDAP.
- Formulario visual no admin em `#comunicacao/restrita`.
- Persistencia da senha da conta de servico em formato protegido no backend.
- Migration aplicada no banco local.

## Estrutura criada

### Backend

- `src/PortalRH.Api/Models/LdapConfiguration.cs`
- `src/PortalRH.Api/Data/Configurations/LdapConfigurationConfiguration.cs`
- `src/PortalRH.Api/Contracts/Admin/Ldap/*`
- `src/PortalRH.Api/Interfaces/ILdapConfigurationService.cs`
- `src/PortalRH.Api/Services/LdapConfigurationService.cs`
- `src/PortalRH.Api/Features/Admin/Ldap/*`
- `src/PortalRH.Api/Controllers/AdminLdapController.cs`

### Frontend

- `LioConnecta/assets/js/services/ldapSettingsService.js`
- ajustes em `LioConnecta/assets/js/communications/renderer.js`
- ajustes em `LioConnecta/assets/js/core/feedback.js`
- ajustes em `LioConnecta/assets/css/components.css`

## Endpoints

- `GET /api/admin/ldap`
- `PUT /api/admin/ldap`

Ambos protegidos por sessao administrativa.

## Observacoes

- Esta entrega ainda nao autentica usuarios finais no LDAP.
- O passo atual cobre apenas configuracao e persistencia.
- O proximo passo natural e criar a tela publica de login e ligar o bind/autenticacao real contra o diretorio corporativo.
