# Career timeline showcase - 2026-06-10

## O que foi criado
- `CareerTimelineViewComponent` como componente mocado e reaproveitável
- View de showcase em `Home/CareerTimelineShowcase`
- Layout visual inspirado na timeline enviada pelo time

## Estrutura adicionada
- Modelos de apoio em `src/PortalRH.Web/Models/CareerTimeline`
- Partial de ícones SVG para manter o componente independente de bibliotecas extras
- Estilos específicos em `wwwroot/css/site.css`

## Cobertura de teste
- Smoke test da página de showcase em `tests/PortalRH.Web.Tests/CareerTimelineShowcaseTests.cs`

## Observação
- Os dados estão mockados de propósito para servir como base visual e de integração futura com o TOTVS RM.

## Ajuste visual em 2026-06-10
- KPIs posicionados na mesma linha do título, alinhados à direita em telas largas
- Título reduzido para ficar mais próximo da referência
- Altura dos cards do histórico diminuída para melhorar a densidade visual

## Ajuste funcional em 2026-06-10
- Adicionados chips com a quantidade de dias entre uma movimentação e outra
- Datas passaram a ser tratadas como valores reais para cálculo automático dos intervalos
- O chip é renderizado no pipe entre os cards da mesma linha
