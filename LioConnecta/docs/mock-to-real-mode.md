# Estratégia Mock → Local → API - LIOCONNECTA

Este documento define como a LIOCONNECTA alterna a origem dos dados sem alterar os renderers da interface.

## Objetivo

Permitir que o frontend rode em três modos:

- `mock`
- `local`
- `api`

## Modos disponíveis

### `mock`

Modo padrão do protótipo.

Origem:

- `assets/data/*.json`

Uso:

- desenvolvimento rápido
- prototipação visual
- validação de layout e comportamento de UI

### `local`

Modo intermediário para simular uma API mais realista, mas ainda com arquivos locais.

Origem:

- `local-api/*.json`

Formato esperado:

```json
{
  "data": {}
}
```

Uso:

- validar consumo com envelope de API
- preparar transição sem depender de backend real
- testar compatibilidade com respostas mais próximas dos contratos

### `api`

Modo preparado para integração real.

Origem:

- endpoints remotos configuráveis

Endpoints padrão atuais:

- `user` → `/me-ui`
- `feed` → `/feed`
- `panels` → `/panels`
- `carousel` → `/carousel`

Observação:

- esses endpoints podem funcionar como adaptadores/BFF enquanto o backend real amadurece

## Configuração

A configuração é centralizada em:

- `assets/js/core/runtimeConfig.js`

Campos principais:

- `version`
- `dataMode`
- `localBasePath`
- `apiBaseUrl`
- `endpoints`

## Como trocar o modo

### Via query string

Exemplos:

- `?dataMode=mock`
- `?dataMode=local`
- `?dataMode=api&apiBaseUrl=http://localhost:8080`

### Via localStorage

Chave:

- `lioconnecta.runtimeConfig`

Exemplo:

```json
{
  "dataMode": "api",
  "apiBaseUrl": "http://localhost:8080",
  "endpoints": {
    "user": "/me-ui",
    "feed": "/feed",
    "panels": "/panels",
    "carousel": "/carousel"
  }
}
```

## Comportamento técnico

- `mock` consome JSON bruto
- `local` e `api` consomem envelope com `data`
- services continuam chamando mappers e validators da mesma forma
- a troca de origem não altera os renderers

## Badge de versão

A badge inferior esquerda agora reflete:

- versão da aplicação
- modo de dados ativo

Exemplo:

- `v0.9.0 • MOCK`
- `v0.9.0 • LOCAL`
- `v0.9.0 • API`

## Estrutura local criada

Foi adicionada a pasta:

- `local-api`

Arquivos atuais:

- `local-api/user.json`
- `local-api/feed.json`
- `local-api/panels.json`
- `local-api/carousel.json`

## Próxima evolução sugerida

- trocar os endpoints adaptadores por endpoints reais do backend/BFF
- ligar `api` a contratos do documento `docs/backend-api-contracts.md`
- adicionar indicador visual de erro de integração por modo
