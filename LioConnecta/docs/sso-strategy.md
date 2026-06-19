# Estratégia de SSO do MVP - LIOCONNECTA

Este documento define a estratégia inicial de autenticação e identificação do usuário para o MVP da LIOCONNECTA.

## Objetivo

Garantir que o portal:

- reconheça automaticamente o colaborador autenticado
- personalize a experiência logo no carregamento da home
- prepare o terreno para integrações futuras com agenda, perfil e serviços corporativos

## Premissa recomendada

Para o MVP, a recomendação é usar:

- `Microsoft Entra ID` como provedor de identidade
- `OpenID Connect (OIDC)` para autenticação
- `OAuth 2.0` para autorização e chamadas futuras em APIs protegidas

Isso conversa bem com o cenário que já discutimos:

- login corporativo com SSO Microsoft
- possibilidade futura de integração com agenda do Teams/Outlook
- identidade centralizada

## O que o frontend precisa saber no MVP

No primeiro carregamento autenticado, a LIOCONNECTA precisa conseguir montar estes dados:

- nome
- email
- foto/avatar
- área
- cargo
- permissões

## Origem recomendada de cada dado

### Vindo do SSO/token

Esses dados devem vir do provedor de identidade ou do token autenticado:

- `name`
- `email`
- `employeeId` ou identificador corporativo
- `avatarUrl` ou referência do usuário
- `tenantId`
- `roles` ou grupos básicos de segurança

### Vindo de API de negócio

Esses dados normalmente não devem depender só do token:

- área
- cargo
- permissões funcionais do portal
- preferências do colaborador
- vínculos RH

Recomendação:

- o token identifica quem é o usuário
- a API de perfil hidrata o contexto organizacional e funcional

## Fluxo recomendado do MVP

1. usuário acessa a LIOCONNECTA
2. aplicação valida sessão SSO existente
3. frontend ou BFF obtém identidade autenticada
4. backend consulta perfil complementar do colaborador
5. frontend consome `GET /me`
6. home é montada com nome, área, permissões e contadores personalizados

## Contrato mínimo esperado para `GET /me`

O endpoint `GET /me` deve ser o ponto de entrada funcional do frontend após autenticação.

Campos mínimos:

- `id`
- `name`
- `greeting`
- `area`
- `email`
- `jobTitle`
- `avatarUrl`
- `notificationCount`
- `permissions`

## Estratégia de permissões

Para o MVP, manter permissões simples e legíveis:

- `home.read`
- `feed.read`
- `agenda.read`
- `quicklinks.read`
- `profile.read`
- `communications.read`

Fase futura:

- permissões por módulo
- permissões por ação
- permissões por perfil RH / gestor / colaborador

## Avatar/foto

Estratégia recomendada:

- usar foto corporativa quando disponível
- usar fallback visual padrão quando indisponível

No MVP:

- `avatarUrl` pode vir vazio
- frontend faz fallback para ícone padrão

## Área e cargo

Esses dados devem vir preferencialmente de sistema corporativo de pessoas ou API de RH.

Motivo:

- são dados organizacionais, não apenas de identidade
- tendem a ser mais confiáveis fora do token
- permitem alinhamento futuro com TOTVS RM ou base corporativa de colaboradores

## Permissões

Permissões não devem depender só de claims estáticos do token quando o portal evoluir.

Estratégia recomendada:

- identidade autenticada via SSO
- autorização funcional resolvida por backend/BFF

Assim o portal pode:

- esconder módulos não autorizados
- adaptar atalhos e cards
- variar experiência por perfil

## Agenda Microsoft / Teams

Sim, existe caminho técnico para obter agenda do usuário autenticado se ele estiver logado via Microsoft SSO.

Modelo recomendado para fase futura:

- autenticar com Microsoft Entra ID
- obter consentimento/scopes adequados
- backend consultar Microsoft Graph
- expor agenda ao frontend por endpoint próprio, sem acoplar a UI diretamente ao Graph

Recomendação para o MVP:

- manter agenda mockada ou vinda de API interna
- deixar integração com Graph como evolução planejada

## Decisões recomendadas para o MVP

- usar SSO Microsoft como estratégia-alvo
- centralizar o contexto autenticado em `GET /me`
- usar API complementar para área, cargo e permissões
- não acoplar o frontend diretamente ao provedor de identidade além da sessão/autenticação
- manter avatar com fallback visual

## O que fica para fase posterior

- refresh token e renovação silenciosa avançada
- múltiplos perfis por usuário
- delegação de acesso
- agenda real via Microsoft Graph
- sincronização com foto corporativa em alta resolução
- regras avançadas por grupo/perfil
