# Gestão de usuários do portal

## Objetivo

Permitir que a LIOCONNECTA registre automaticamente os usuários que acessarem o portal e disponibilize uma área restrita ao super-admin para consultar e gerenciar esse cadastro.

## O que foi implementado

### Registro automático de usuários

- No login LDAP bem-sucedido, o backend persiste o usuário na tabela `PortalUsers`.
- O registro mantém:
  - `Login`
  - `DisplayName`
  - `Email`
  - `Department`
  - `Title`
  - `AuthenticationProvider`
  - `LastLoginAtUtc`
  - `IsActive`

### Bloqueio administrativo

- Usuários desativados não conseguem mais autenticar no portal.
- Ao desativar um usuário, o backend também revoga as sessões ativas desse colaborador.

### Endpoints administrativos

- `GET /api/admin/portal-users`
  - Lista todos os usuários registrados no portal.
  - Requer sessão administrativa ativa.
  - Restrito ao `SuperAdmin`.

- `PATCH /api/admin/portal-users/{id}/status`
  - Atualiza o status `IsActive`.
  - Requer sessão administrativa ativa.
  - Restrito ao `SuperAdmin`.

## Rotas da interface

- `#configuracoes`
  - Exibe a governança administrativa e o formulário LDAP.
  - Possui atalho para gestão de usuários.

- `#admin/usuarios`
  - Lista os usuários registrados.
  - Exibe KPIs de usuários ativos, inativos e departamentos mapeados.
  - Permite pesquisar e filtrar por status.
  - Permite ativar/desativar acesso.

## Regras atuais

- Apenas o super-admin pode acessar `#admin/usuarios`.
- Apenas o super-admin pode alterar o status de acesso.
- Se a sessão administrativa expirar, a interface redireciona para o login admin.

## Próximos passos sugeridos

- Adicionar paginação e ordenação na listagem.
- Exibir histórico de acessos por usuário.
- Incluir trilha de auditoria para ativações e bloqueios.
- Permitir associação futura de perfis e permissões por módulo.
