# Fluxos Prioritários do MVP - LIOCONNECTA

Este documento consolida os fluxos prioritários do MVP da LIOCONNECTA com base nas decisões já alinhadas.

Objetivo:

- transformar a visão do MVP em jornadas claras
- orientar implementação, layout e contratos de dados
- deixar explícito o que é obrigatório nesta fase

---

## Resumo executivo

Fluxos que entram no MVP:

- Fluxo 1: colaborador entra e vê seu painel
- Fluxo 2: colaborador acompanha comunicados e feed
- Fluxo 3: colaborador acessa serviços RH rápidos

Ordem de prioridade:

1. colaborador entra e vê seu painel
2. colaborador acompanha comunicados e feed
3. colaborador acessa serviços RH rápidos

---

## Fluxo 1 - Colaborador entra e vê seu painel

### Objetivo

Entregar uma visão completa e imediata da intranet logo no primeiro acesso, com tudo o que o colaborador precisa ver ao chegar.

### Critério principal

Na primeira dobra da tela deve aparecer tudo o que for central para contextualização e ação rápida.

### Itens obrigatórios na primeira dobra

- banner de boas-vindas
- notificações
- agenda do dia
- acessos rápidos
- comunicados
- feed
- perfil resumido

### Módulos envolvidos

- Home / mural
- Perfil do colaborador
- Notificações
- Agenda / compromissos
- Acessos rápidos
- Comunicação
- Feed social interno

### Dependências de dados

- usuário logado
- resumo do perfil
- agenda resumida
- notificações recentes
- cards laterais
- primeiros itens do feed
- banners/comunicados
- atalhos principais

### Critério de pronto do fluxo

- o colaborador entra e entende rapidamente onde está
- o painel mostra contexto pessoal, conteúdo e atalhos
- a primeira dobra transmite utilidade real e percepção de produto

---

## Fluxo 2 - Colaborador acompanha comunicados e feed

### Objetivo

Fazer a LIOCONNECTA funcionar como canal vivo de comunicação e experiência social interna.

### Foco do MVP

O foco é uma experiência social mais completa do ponto de vista de percepção de produto, mesmo que a publicação ainda seja mockada nesta fase.

### O que deve existir no MVP

- leitura de posts
- leitura de comunicados
- interações visuais com reações
- interações visuais com comentários
- composer visual
- sensação de fluxo social interno ativo

### O que não entra ainda

- publicação real persistida
- backend real de postagem
- workflow real de moderação/publicação

### Decisão importante

A publicação de post no MVP será:

- mockada visualmente
- sem persistência real
- sem criação real de conteúdo

### Módulos envolvidos

- Comunicação
- Feed social interno
- Notificações

### Dependências de dados

- banners/comunicados
- posts
- autores
- comentários
- reações
- estados visuais do composer

### Critério de pronto do fluxo

- o colaborador consegue consumir conteúdo institucional e social
- o feed transmite dinamismo
- a experiência parece pronta para integração real posterior

---

## Fluxo 3 - Colaborador acessa serviços RH rápidos

### Objetivo

Dar acesso rápido às principais demandas de RH sem exigir navegação longa.

### Acessos obrigatórios no MVP

- férias
- holerite
- benefícios
- avaliação
- dados cadastrais
- ponto
- treinamentos
- chamados RH

### Comportamento esperado no MVP

Ao clicar em um acesso rápido:

- abrir placeholder/mock screen
- não navegar ainda para sistema real
- manter experiência coerente com o futuro comportamento final

### Módulos envolvidos

- Acessos rápidos
- Perfil do colaborador
- Home / mural

### Dependências de dados

- lista de serviços RH
- nome amigável
- ícone visual
- categoria
- destino mockado

### Critério de pronto do fluxo

- o colaborador encontra rapidamente os serviços principais
- os atalhos comunicam com clareza para onde levam
- a navegação mockada já permite validar UX e arquitetura

---

## Decisões já tomadas

- os 3 fluxos entram no MVP
- prioridade definida: `1 > 2 > 3`
- na primeira dobra do fluxo 1 deve aparecer tudo o que é central
- o fluxo 2 deve passar sensação de experiência social completa
- a publicação real ainda não entra
- os serviços RH rápidos são todos obrigatórios
- os cliques dos serviços RH rápidos abrirão placeholders/mock screens

---

## Impacto técnico dessas decisões

Com base nesses fluxos, o MVP precisa priorizar:

- composição forte da home
- feed e comunicação com alto peso visual
- estrutura de placeholders navegáveis para RH
- dados semirrealistas por domínio
- contratos claros para usuário, feed, agenda, notificações e quick links

---

## Critério geral de sucesso do MVP

O MVP será bem-sucedido se:

- o colaborador perceber valor logo na entrada
- o feed e a comunicação parecerem vivos e relevantes
- os serviços RH estiverem claros e acessíveis
- a base técnica permitir troca futura de mock para integração real
