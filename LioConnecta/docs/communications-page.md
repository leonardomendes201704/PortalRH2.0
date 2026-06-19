# Central de Comunicacao Oficial

Esta implementacao adiciona uma pagina dedicada para concentrar todos os comunicados oficiais da LIOCONNECTA.

## Objetivo

- tirar a dependencia exclusiva da home para consumo de comunicados
- consolidar avisos institucionais em uma pagina propria
- manter o mesmo padrao visual e de navegacao do prototipo atual

## Acesso

- menu superior `COMUNICACAO`
- rota em hash: `#comunicacao`

## Estrutura entregue

- hero institucional da central
- cards KPI com indicadores de comunicacao
- filtros mockados por categoria
- bloco de comunicado em destaque
- lista completa de comunicados oficiais
- acoes mockadas de leitura e download

## Dados mockados

Arquivos criados:

- `assets/data/communications.json`
- `local-api/communications.json`

## Camada tecnica

Arquivos adicionados/atualizados:

- `assets/js/services/communicationService.js`
- `assets/js/mappers/communicationMapper.js`
- `assets/js/validators/communicationValidator.js`
- `assets/js/communications/index.js`
- `assets/js/communications/service.js`
- `assets/js/communications/mapper.js`
- `assets/js/communications/validator.js`
- `assets/js/communications/renderer.js`
- `assets/js/app.js`

## Observacoes

- a navegacao foi preparada via hash route
- `INICIO` continua sendo a rota padrao
- as demais tabs do menu continuam reservadas e podem evoluir depois
