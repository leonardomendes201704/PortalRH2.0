# Contratos de Backend do MVP - LIOCONNECTA

Este documento define os contratos iniciais de integração entre frontend e backend para o MVP da LIOCONNECTA.

Objetivos desta definição:

- alinhar nomes de campos entre frontend e backend
- permitir evolução do mock para API real sem retrabalho estrutural
- servir como base para BFF, API gateway ou APIs de domínio

## Premissas

- formato de resposta: `application/json`
- autenticação: sessão autenticada via SSO corporativo
- timezone padrão do MVP: `America/Sao_Paulo`
- datas de agenda e notificações devem ser retornadas em ISO 8601 quando houver campo temporal completo
- endpoints podem ser implementados por um BFF agregador no início

## Convenções de resposta

### Sucesso

```json
{
  "data": {}
}
```

### Lista vazia

```json
{
  "data": [],
  "meta": {
    "total": 0
  }
}
```

### Erro

```json
{
  "error": {
    "code": "RESOURCE_UNAVAILABLE",
    "message": "Não foi possível carregar os dados solicitados.",
    "traceId": "9f4dca4d-ef6f-4c11-95a2-bd8d563a8c41"
  }
}
```

---

## 1. `GET /me`

Retorna os dados básicos do usuário autenticado para personalização da experiência.

### Resposta de sucesso

```json
{
  "data": {
    "id": "usr-1001",
    "name": "Roberto Almeida",
    "greeting": "Olá,",
    "area": "Recursos Humanos",
    "email": "roberto.almeida@empresa.com.br",
    "jobTitle": "Analista Sênior de RH",
    "avatarUrl": "",
    "notificationCount": 20,
    "permissions": [
      "home.read",
      "feed.read",
      "agenda.read",
      "quicklinks.read",
      "profile.read"
    ]
  }
}
```

### Resposta de erro esperada

- `401 UNAUTHORIZED`
- `403 FORBIDDEN`

---

## 2. `GET /home`

Retorna o contexto agregado da home/mural do colaborador.

Recomendação prática:

- manter este endpoint como agregador inicial do MVP
- ele pode internamente consultar `/me`, `/agenda`, `/quick-links`, `/notifications`, `/feed` e `/communications`

### Resposta de sucesso

```json
{
  "data": {
    "brand": {
      "name": "LIOCONNECTA",
      "tagline": "Capacidade e Transformação Digital"
    },
    "hero": {
      "title": "Bem-vindo à LIOCONNECTA!",
      "subtitle": "O seu ponto central de acesso e colaboração."
    },
    "mood": {
      "title": "Como você está se sentindo hoje?",
      "items": [
        { "emoji": "😄", "label": "Motivado", "rank": "1º mais votado" },
        { "emoji": "🙂", "label": "Bem", "rank": "2º mais votado" },
        { "emoji": "😴", "label": "Cansado", "rank": "3º mais votado" }
      ]
    },
    "leftPanels": [
      {
        "title": "MINHA JORNADA",
        "items": [
          { "label": "Tarefas Pendentes", "badge": "5" },
          { "label": "Solicitações em Andamento", "badge": "3" }
        ]
      }
    ],
    "rightPanels": [
      {
        "type": "profile",
        "title": "MEU PERFIL RH",
        "name": "Roberto Almeida",
        "subtitle": "Recursos Humanos",
        "items": [
          "Férias (Consultar/Solicitar)",
          "Holerite (Maio 2024)"
        ]
      }
    ]
  }
}
```

### Resposta vazia

Não recomendada para este endpoint.

Se algum bloco estiver indisponível, retornar o bloco com coleção vazia:

```json
{
  "data": {
    "leftPanels": [],
    "rightPanels": []
  }
}
```

---

## 3. `GET /feed`

Retorna o feed social interno da home.

### Query params sugeridos

- `page`: inteiro, opcional
- `pageSize`: inteiro, opcional

### Resposta de sucesso

```json
{
  "data": {
    "title": "FEED LIOCONNECTA",
    "composer": {
      "title": "No que você está pensando?",
      "placeholder": "Compartilhe uma atualização com a equipe...",
      "actions": ["Foto", "Evento", "Comunicado", "Conquista"]
    },
    "posts": [
      {
        "id": "post-1001",
        "author": "Carla Mendes",
        "area": "Gestão de Pessoas",
        "timeAgo": "há 35 min",
        "text": "Hoje iniciamos uma nova rodada de integração para colaboradores da área de RH.",
        "highlightTitle": "Onboarding RH - Junho",
        "highlightText": "Checklist digital, acessos liberados e trilha de aprendizagem inicial.",
        "image": "",
        "imageAlt": "",
        "reactions": 48,
        "commentsCount": 12,
        "sharesCount": 4,
        "comments": [
          {
            "author": "Fernanda Lima",
            "text": "Excelente iniciativa para acelerar a integração."
          }
        ]
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 10
  }
}
```

### Resposta vazia

```json
{
  "data": {
    "title": "FEED LIOCONNECTA",
    "composer": {
      "title": "No que você está pensando?",
      "placeholder": "Compartilhe uma atualização com a equipe...",
      "actions": ["Foto", "Evento", "Comunicado", "Conquista"]
    },
    "posts": []
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 0
  }
}
```

---

## 4. `GET /notifications`

Retorna notificações recentes e resumo total para header/painéis.

### Query params sugeridos

- `page`: inteiro, opcional
- `pageSize`: inteiro, opcional
- `category`: string, opcional

### Resposta de sucesso

```json
{
  "data": {
    "total": 20,
    "summary": [
      { "label": "Comunicados Novos", "count": 4 },
      { "label": "Interações no Feed", "count": 6 },
      { "label": "Aprovações Pendentes", "count": 2 },
      { "label": "Eventos/Reuniões", "count": 5 },
      { "label": "Aniversários", "count": 1 },
      { "label": "Atualizações de Sistema", "count": 2 }
    ],
    "items": [
      {
        "id": "ntf-1001",
        "category": "feed",
        "title": "Novo comentário no seu post",
        "description": "Luciana Prado comentou na publicação sobre onboarding.",
        "createdAt": "2026-06-18T09:15:00-03:00",
        "read": false,
        "actionUrl": "/feed/post-1001"
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 20
  }
}
```

### Resposta vazia

```json
{
  "data": {
    "total": 0,
    "summary": [],
    "items": []
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 0
  }
}
```

---

## 5. `GET /quick-links`

Retorna os atalhos rápidos exibidos no painel lateral.

### Resposta de sucesso

```json
{
  "data": [
    {
      "id": "ql-001",
      "className": "sap",
      "label": "Gestão Integrada",
      "shortLabel": "SAP",
      "url": "/redirect/sap"
    },
    {
      "id": "ql-002",
      "className": "google",
      "label": "Google Workspace",
      "shortLabel": "G",
      "url": "/redirect/google"
    }
  ],
  "meta": {
    "total": 10
  }
}
```

### Resposta vazia

```json
{
  "data": [],
  "meta": {
    "total": 0
  }
}
```

---

## 6. `GET /agenda`

Retorna a agenda do dia do colaborador.

### Query params sugeridos

- `date`: string no formato `YYYY-MM-DD`, opcional

### Resposta de sucesso

```json
{
  "data": [
    {
      "id": "agd-1001",
      "title": "Daily RH",
      "label": "09:00 • Daily RH",
      "startAt": "2026-06-18T09:00:00-03:00",
      "endAt": "2026-06-18T09:30:00-03:00",
      "location": "Microsoft Teams",
      "source": "corporate-calendar"
    },
    {
      "id": "agd-1002",
      "title": "Comitê de Pessoas",
      "label": "10:00 • Comitê de Pessoas",
      "startAt": "2026-06-18T10:00:00-03:00",
      "endAt": "2026-06-18T11:00:00-03:00",
      "location": "Sala São Paulo",
      "source": "corporate-calendar"
    }
  ],
  "meta": {
    "date": "2026-06-18",
    "total": 10
  }
}
```

### Resposta vazia

```json
{
  "data": [],
  "meta": {
    "date": "2026-06-18",
    "total": 0
  }
}
```

---

## 7. `GET /hr/profile`

Retorna dados resumidos do painel RH lateral do colaborador.

### Resposta de sucesso

```json
{
  "data": {
    "name": "Roberto Almeida",
    "subtitle": "Recursos Humanos",
    "items": [
      "Férias (Consultar/Solicitar)",
      "Holerite (Maio 2024)",
      "Benefícios (Seguro/VT)",
      "Minha Avaliação",
      "Dados Cadastrais",
      "Ponto",
      "Treinamentos",
      "Chamados RH"
    ]
  }
}
```

### Resposta vazia

```json
{
  "data": {
    "name": "Roberto Almeida",
    "subtitle": "Recursos Humanos",
    "items": []
  }
}
```

---

## Observações de implementação

### MVP recomendado

- `GET /home` como endpoint agregador da tela inicial
- `GET /feed`, `GET /agenda`, `GET /quick-links` e `GET /notifications` como endpoints independentes reutilizáveis
- `GET /me` e `GET /hr/profile` como base de personalização

### Campos importantes já alinhados com o frontend atual

- `user.notificationCount`
- `user.area`
- `hero.title`
- `mood.title`
- `composer.title`
- `posts[].author`
- `posts[].comments`
- `leftPanels[]`
- `rightPanels[]`
- `quick-links[].className`
- `quick-links[].shortLabel`

### Próximas evoluções esperadas

- paginação real no feed
- marcação de lido/não lido em notificações
- integração com agenda corporativa
- SSO com hidratação automática de perfil
- URLs reais para quick links
