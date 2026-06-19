# Áreas Funcionais do Frontend - LIOCONNECTA

Este documento registra a separação funcional adotada no frontend do MVP.

## Objetivo

Organizar o código por área de negócio/experiência, e não apenas por tipo técnico de arquivo.

Isso facilita:

- evolução incremental do MVP
- leitura do código por contexto
- redução de acoplamento no bootstrap
- futura troca de mock por API real

## Estrutura adotada

### `assets/js/layout`

Responsável por shell e estrutura visual compartilhada:

- header/topbar
- menu principal
- sidebars
- cards laterais

Arquivos principais:

- `layout/header.js`
- `layout/sidebar.js`
- `layout/index.js`

### `assets/js/home`

Responsável pela composição da home/mural:

- hero/banner
- card de humor do dia
- estado de erro da home
- agregação dos domínios da tela inicial

Arquivos principais:

- `home/renderer.js`
- `home/service.js`
- `home/index.js`

### `assets/js/feed`

Responsável pelo feed social interno:

- renderer do feed
- consumo do serviço de feed
- mapper de posts
- validação do contrato de feed

Arquivos principais:

- `feed/renderer.js`
- `feed/service.js`
- `feed/mapper.js`
- `feed/validator.js`
- `feed/index.js`

### `assets/js/communications`

Responsável pela comunicação centralizada:

- carrossel/banner de comunicação
- service do carrossel
- mapper e validator do contrato

Arquivos principais:

- `communications/renderer.js`
- `communications/service.js`
- `communications/mapper.js`
- `communications/validator.js`
- `communications/index.js`

### `assets/js/profile`

Responsável pelo contexto do colaborador autenticado:

- usuário logado
- dados para topbar
- composer e humor de entrada
- mapper/validator do contexto do usuário

Arquivos principais:

- `profile/service.js`
- `profile/mapper.js`
- `profile/validator.js`
- `profile/index.js`

### `assets/js/services`

Responsável pelos painéis de serviços e atalhos laterais:

- quick links
- painel RH
- agenda do dia
- comunicados
- mapeamento e validação dos painéis

Arquivos principais:

- `services/panelService.js`
- `services/index.js`

## Compatibilidade

Os caminhos antigos por tipo técnico continuam existindo:

- `components`
- `services`
- `mappers`
- `validators`

Eles seguem úteis durante a transição e preservam compatibilidade com testes e imports antigos.

## Diretriz daqui para frente

Novas evoluções devem priorizar a área funcional primeiro:

- se for feed, nasce em `feed`
- se for comunicação institucional, nasce em `communications`
- se for contexto do colaborador, nasce em `profile`
- se for shell/layout, nasce em `layout`
- se for home agregada, nasce em `home`

Quando a base amadurecer mais, podemos fazer a segunda etapa:

- mover a implementação interna de vez para as áreas funcionais
- deixar `components`, `mappers`, `validators` e parte de `services` apenas como legado temporário ou removê-los
