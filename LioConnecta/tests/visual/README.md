# Testes visuais

Base inicial para testes visuais do protótipo LIOCONNECTA.

Próximo passo sugerido:

1. Adicionar Playwright ao repositório.
2. Criar snapshot da `index.html` em desktop e mobile.
3. Validar estados do carrossel, feed e painéis laterais sticky.

Antes disso, os testes unitários da camada de dados podem ser executados com:

```bash
npm test
```

Checklist inicial:

- topbar sticky alinhada
- sidebars sticky sem sobrepor header
- carrossel com autoplay e dots
- feed com imagens, reações e comentários
- renderização correta com `assets/data/user.json`
- renderização correta com `assets/data/carousel.json`
- renderização correta com `assets/data/feed.json`
- renderização correta com `assets/data/panels.json`
