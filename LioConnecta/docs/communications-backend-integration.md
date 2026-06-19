# Integração real de comunicados

Data: 2026-06-19

## Objetivo

Conectar a experiência de comunicação da LIOCONNECTA ao backend real em `.NET 8` com PostgreSQL, começando pelo domínio de comunicados.

## O que foi implementado

- rota restrita `#comunicacao/restrita` agora publica no backend real
- central `#comunicacao` agora consulta a API real para listar comunicados
- carrossel da home passa a priorizar comunicados reais com imagem
- fallback visual mantido para mock local caso a API esteja indisponível
- CORS habilitado no backend para:
  - `http://127.0.0.1:4173`
  - `http://localhost:4173`

## Endpoint utilizado

- `GET http://localhost:5001/api/communications`
- `POST http://localhost:5001/api/communications`

## Estratégia adotada

- o arquivo `assets/data/communications.json` continua como template visual da central
- os itens reais vêm da API
- quando a API retorna itens:
  - um comunicado destacado é escolhido por `isFeatured`
  - os KPIs e filtros são recalculados a partir da resposta real
  - a data de atualização da central é derivada do item mais recente
- quando a API falha:
  - a UI continua funcional com fallback local

## Campos enviados no publish

- `category`
- `priority`
- `title`
- `summary`
- `body`
- `audience`
- `channel`
- `status`
- `attachmentLabel`
- `owner`
- `imageUrl`
- `isFeatured`
- `publishedAt`

## Observações

- a imagem está sendo enviada temporariamente como `data URL` para acelerar a validação do MVP
- em uma próxima etapa, vale migrar para upload de arquivo com armazenamento dedicado
- a rota restrita ainda não possui autenticação/autorização

## Validação executada

- `dotnet build` da API
- `dotnet test` da API
- `npm.cmd test` do frontend
- subida local da API em `http://localhost:5001`
- leitura validada da coleção real de comunicados no PostgreSQL local
