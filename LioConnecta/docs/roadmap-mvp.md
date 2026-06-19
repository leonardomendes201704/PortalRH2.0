# Roadmap MVP - LIOCONNECTA

Este documento organiza os próximos passos do MVP da LIOCONNECTA com foco em entrega de valor, clareza de escopo e acompanhamento do que já foi concluído.

Como usar:

- marque com `x` os itens concluídos
- use este documento como referência de priorização
- atualize decisões e observações conforme o MVP evoluir

## Status atual

- [x] Protótipo navegável em HTML/CSS/JS
- [x] Estrutura de componentes inicial
- [x] Mock API em JSON separada por domínio
- [x] Camada de services
- [x] Camada de mappers e view-models
- [x] Validação básica de contrato dos dados mockados
- [x] Módulos do MVP formalmente definidos
- [x] Fluxos prioritários validados com o negócio
- [x] Contratos de backend documentados
- [x] Estratégia de SSO definida

---

## 1. Definir os módulos reais do MVP

- [x] Home / mural
- [x] Comunicação
- [x] Perfil do colaborador
- [x] Agenda / compromissos
- [x] Acessos rápidos
- [x] Feed social interno
- [x] Notificações

Observações:

- objetivo desta etapa: fechar o escopo funcional real do MVP
- evitar incluir módulos “desejáveis” sem impacto imediato de uso
- documento de apoio: `docs/mvp-modules.md`

---

## 2. Escolher 2 ou 3 fluxos prioritários

Sugestão inicial:

- [x] Colaborador entra e vê seu painel
- [x] Colaborador acompanha comunicados e feed
- [x] Colaborador acessa serviços RH rápidos

Observações:

- esses fluxos devem orientar layout, dados e integrações iniciais
- tudo que não sustentar esses fluxos pode ficar para a próxima fase
- prioridade definida: `1 > 2 > 3`
- documento de apoio: `docs/mvp-priority-flows.md`

---

## 3. Substituir parte do mock por dados semirrealistas

- [x] Usuário logado
- [x] Notificações
- [x] Agenda do dia
- [x] Cards laterais
- [x] Posts do feed
- [x] Acessos rápidos

Observações:

- usar conteúdo mais próximo do cenário real do portal
- manter consistência entre áreas, cargos, agenda e comunicados
- baseline aprovado para o mock do MVP:
  - usuário: Roberto Almeida / Recursos Humanos
  - notificações: 20
  - agenda do dia: 10
  - posts do feed: 10
  - acessos rápidos: 10
- documento de apoio: `docs/mvp-semirrealistic-data.md`

---

## 4. Criar contrato de integração com backend

Mesmo sem integrar agora:

- [x] `GET /me`
- [x] `GET /home`
- [x] `GET /feed`
- [x] `GET /notifications`
- [x] `GET /quick-links`
- [x] `GET /agenda`
- [x] `GET /hr/profile`

Observações:

- definir payload de request/response
- alinhar nomes de campos esperados no frontend
- documentar respostas de sucesso, vazio e erro
- documento de apoio: `docs/backend-api-contracts.md`

---

## 5. Preparar integração com SSO

- [x] Identificar usuário autenticado
- [x] Nome
- [x] Email
- [x] Foto/avatar
- [x] Área
- [x] Cargo
- [x] Permissões

Observações:

- esta etapa é crítica para personalização e segurança
- alinhar desde cedo o que virá do SSO e o que virá de APIs complementares
- documento de apoio: `docs/sso-strategy.md`

---

## 6. Separar o MVP por áreas funcionais

- [x] `layout`
- [x] `home`
- [x] `feed`
- [x] `communications`
- [x] `profile`
- [x] `services`

Observações:

- usar essa divisão para organizar pastas, renderers, services e contratos
- facilita manutenção e evolução futura
- documento de apoio: `docs/mvp-functional-areas.md`

---

## 7. Priorizar componentes que geram percepção de produto

- [x] Composer funcional visualmente
- [x] Cards de notificação
- [x] Agenda
- [x] Acessos rápidos
- [x] Feed com comentários/reação mockada
- [x] Painel RH

Observações:

- esses itens ajudam a transformar wireframe em percepção de produto real
- priorizar primeiro o que o usuário final enxerga e usa mais
- documento de apoio: `docs/mvp-product-components.md`

---

## 8. Começar modo “mock → real”

- [x] Manter mock por padrão
- [x] Permitir trocar depois para API real por config

Observações:

- definir uma estratégia simples de ambiente
- exemplo: `mock`, `local`, `api`
- documento de apoio: `docs/mock-to-real-mode.md`

---

## 9. Refinar UX do que já existe

- [ ] Loading states
- [ ] Empty states
- [ ] Erro amigável
- [ ] Estados de clique/hover
- [ ] Feedback de ação

Observações:

- essa etapa evita que o MVP pareça “quebrado” mesmo quando estiver funcional
- pequenas respostas visuais aumentam muito a percepção de qualidade

---

## 10. Documentar decisões do MVP

- [ ] O que entra
- [ ] O que fica fora
- [ ] Quais endpoints serão necessários
- [ ] Quais integrações futuras existem

Observações:

- manter esse registro simples e atualizado
- ajuda alinhamento entre produto, design e desenvolvimento

---

## Ordem prática recomendada

- [ ] Modelar os dados reais do MVP
- [ ] Montar as telas / módulos prioritários
- [x] Definir contratos de API
- [x] Preparar SSO + perfil do usuário
- [ ] Só depois aprofundar testes

---

## Backlog futuro

- [ ] Testes visuais automatizados
- [ ] Testes de integração frontend
- [ ] Acessibilidade avançada
- [ ] Responsividade completa
- [ ] PWA mais robusto
- [ ] Telemetria de uso real

---

## Histórico de progresso

- [ ] Atualizar este roadmap a cada entrega importante
- [ ] Registrar decisões que alterem escopo ou prioridade
- [ ] Revisar semanalmente com os responsáveis
