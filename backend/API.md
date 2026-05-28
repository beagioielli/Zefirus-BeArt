# Zefirus BeArt — API Reference

Base URL: `http://localhost:8000/api`

---

## Autenticação

A API usa **Laravel Sanctum** com tokens Bearer. Todas as rotas marcadas com 🔒 exigem o header:

```
Authorization: Bearer {token}
```

### POST /login

Autentica um usuário e retorna um token de acesso.

**Body (JSON)**
```json
{
  "email": "admin@zefirus.com",
  "password": "sua-senha"
}
```

**Resposta 200**
```json
{
  "token": "1|AbCdEfGhIjKlMnOpQrStUvWxYz...",
  "user": {
    "id": 1,
    "name": "Beatriz",
    "email": "admin@zefirus.com"
  }
}
```

**Resposta 401** — credenciais inválidas
```json
{ "message": "Credenciais inválidas." }
```

---

### POST /logout 🔒

Invalida o token atual.

**Resposta 200**
```json
{ "message": "Logged out" }
```

---

## Obras (Artworks)

### GET /artworks

Lista obras publicadas (público).

**Query params**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `page` | int | Página (default 1) |

**Resposta 200**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Névoa Dourada",
      "description": "...",
      "dimensions": "60x80cm",
      "price": "5233.46",
      "stock": 1,
      "is_sold": false,
      "image_url": "http://localhost:8000/storage/...",
      "art_collection_id": null
    }
  ],
  "current_page": 1,
  "last_page": 3,
  "total": 25
}
```

---

### GET /artworks/{id}

Retorna uma obra pelo ID (público).

**Resposta 200**
```json
{
  "id": 1,
  "title": "Névoa Dourada",
  "description": "Técnica mista sobre tela...",
  "dimensions": "60x80cm",
  "price": "5233.46",
  "stock": 1,
  "is_sold": false,
  "is_archived": false,
  "is_awarded": false,
  "year": "2024",
  "availability": "available",
  "edition_info": null,
  "external_video_url": null,
  "shipping_weight": "1.50",
  "shipping_height": 10,
  "shipping_width": 65,
  "shipping_length": 85,
  "image_url": "http://localhost:8000/storage/...",
  "art_collection_id": null
}
```

**Resposta 404**
```json
{ "message": "No query results for model [Artwork] 99" }
```

---

### GET /admin/artworks 🔒

Lista todas as obras (incluindo arquivadas), com paginação.

**Query params:** `page`

---

### POST /admin/artworks 🔒

Cria uma nova obra.

**Body (multipart/form-data)**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `title` | string | ✅ | Título da obra |
| `description` | string | ✅ | Descrição |
| `dimensions` | string | ✅ | Ex: `60x80cm` |
| `price` | numeric | — | Preço em reais |
| `stock` | integer | ✅ | Quantidade em estoque |
| `is_sold` | boolean | — | Default: false |
| `is_archived` | boolean | — | Default: false |
| `is_awarded` | boolean | — | Default: false |
| `year` | string | — | Ano de criação |
| `art_collection_id` | integer | — | ID da coleção |
| `external_video_url` | url | — | Link do vídeo |
| `availability` | string | — | `available`, `reserved`, `sold` |
| `edition_info` | string | — | Info de edição |
| `shipping_weight` | numeric | — | Peso em kg |
| `shipping_height` | integer | — | Altura em cm |
| `shipping_width` | integer | — | Largura em cm |
| `shipping_length` | integer | — | Comprimento em cm |
| `photos[]` | file | — | Fotos da obra (múltiplos) |

**Resposta 201** — obra criada

---

### GET /admin/artworks/{id} 🔒

Retorna uma obra com mídias.

---

### PUT /admin/artworks/{id} 🔒

Atualiza uma obra. Mesmos campos do POST.

---

### DELETE /admin/artworks/{id} 🔒

Remove uma obra.

**Resposta 200**
```json
{ "message": "Deleted successfully" }
```

---

### DELETE /admin/artworks/{id}/media/{mediaId} 🔒

Remove uma foto específica da obra.

---

## Coleções (Collections)

### GET /admin/collections 🔒

Lista todas as coleções.

**Resposta 200**
```json
[
  {
    "id": 1,
    "title": "Série Crepúsculo",
    "slug": "serie-crepusculo",
    "description": "..."
  }
]
```

---

### POST /admin/collections 🔒

Cria uma coleção.

**Body (JSON)**
```json
{
  "title": "Nova Série",
  "description": "Descrição da série...",
  "artwork_ids": [1, 2, 3]
}
```

**Resposta 201**

---

### GET /admin/collections/{id} 🔒

Retorna coleção com obras vinculadas.

---

### PUT /admin/collections/{id} 🔒

Atualiza coleção. Mesmos campos do POST.

---

### DELETE /admin/collections/{id} 🔒

Remove coleção.

---

## Blog (Posts)

### GET /posts

Lista posts publicados (público).

**Query params:** `page`

**Resposta 200**
```json
{
  "data": [
    {
      "id": 1,
      "title": "O processo criativo",
      "slug": "o-processo-criativo-a1b2c",
      "excerpt": "...",
      "cover_image": "https://...",
      "published_at": "2026-04-15T10:00:00Z",
      "is_published": true
    }
  ]
}
```

---

### GET /posts/{slug}

Retorna um post pelo slug (público).

---

### GET /admin/posts 🔒

Lista todos os posts (publicados e rascunhos).

---

### POST /admin/posts 🔒

Cria um post. Slug é gerado automaticamente a partir do título.

**Body (JSON)**
```json
{
  "title": "Título do Post",
  "excerpt": "Resumo curto opcional",
  "content": "Conteúdo completo em HTML ou Markdown",
  "cover_image": "https://url-da-imagem.com/foto.jpg",
  "published_at": "2026-05-01T10:00:00",
  "is_published": true
}
```

**Resposta 201**
```json
{
  "id": 5,
  "title": "Título do Post",
  "slug": "titulo-do-post-x8k2m",
  "is_published": true
}
```

---

### GET /admin/posts/{id} 🔒

Retorna um post pelo ID.

---

### PUT /admin/posts/{id} 🔒

Atualiza um post. Todos os campos são opcionais.

---

### DELETE /admin/posts/{id} 🔒

Remove um post.

---

## Eventos (Events)

### GET /events

Lista eventos ordenados por data (público).

**Resposta 200**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Exposição Coletiva SP",
      "slug": "exposicao-coletiva-sp-b3c4d",
      "description": "...",
      "location": "Galeria Sesc Paulista",
      "starts_at": "2026-06-10T19:00:00Z",
      "ends_at": "2026-06-20T22:00:00Z",
      "is_featured": true,
      "external_url": "https://..."
    }
  ]
}
```

---

### GET /events/{slug}

Retorna um evento pelo slug (público).

---

### GET /admin/events 🔒

Lista todos os eventos (decrescente por data).

---

### POST /admin/events 🔒

Cria um evento.

**Body (JSON)**
```json
{
  "title": "Vernissage",
  "description": "Abertura da exposição individual...",
  "location": "Galeria de Arte Centro SP",
  "starts_at": "2026-07-01T19:00:00",
  "ends_at": "2026-07-01T22:00:00",
  "cover_image": "https://...",
  "external_url": "https://...",
  "is_featured": false
}
```

**Resposta 201**

---

### GET /admin/events/{id} 🔒

Retorna um evento pelo ID.

---

### PUT /admin/events/{id} 🔒

Atualiza um evento. Todos os campos são opcionais.

---

### DELETE /admin/events/{id} 🔒

Remove um evento.

---

## Tarefas (Tasks)

### GET /admin/tasks 🔒

Lista todas as tarefas com subtarefas.

**Resposta 200**
```json
[
  {
    "id": "uuid-da-tarefa",
    "title": "Preparar catálogo",
    "column": "doing",
    "category": "Arte",
    "subcategory": "Produção",
    "color": "#D2C3B3",
    "subtasks": [
      {
        "id": "uuid-da-subtarefa",
        "task_id": "uuid-da-tarefa",
        "text": "Fotografar obras",
        "done": false,
        "completed_at": null
      }
    ]
  }
]
```

---

### POST /admin/tasks 🔒

Cria uma tarefa com subtarefas opcionais.

**Body (JSON)**
```json
{
  "title": "Nova tarefa",
  "column": "todo",
  "category": "Arte",
  "subcategory": "Produção",
  "color": "#D2C3B3",
  "subtasks": [
    { "text": "Subtarefa 1" },
    { "text": "Subtarefa 2" }
  ]
}
```

**Colunas disponíveis:** `todo`, `doing`, `done`

**Resposta 201**

---

### PUT /admin/tasks/{id} 🔒

Atualiza uma tarefa (título, coluna, categoria, cor).

---

### DELETE /admin/tasks/{id} 🔒

Remove uma tarefa e suas subtarefas.

---

### PATCH /admin/tasks/{taskId}/subtasks/{subtaskId} 🔒

Marca/desmarca uma subtarefa como concluída.

**Body (JSON)**
```json
{
  "done": true,
  "completedAt": "2026-05-12T14:30:00"
}
```

**Resposta 200** — tarefa completa com subtarefas

---

## Experiências (Acquired Experiences)

### GET /experience/{unique_hash}

Retorna a experiência sensorial do comprador pelo hash único (público).

**Resposta 200**
```json
{
  "id": 1,
  "buyer_name": "João Silva",
  "dedication": "Para você, que escolheu guardar este momento...",
  "creation_video_url": "https://youtube.com/...",
  "exhibition_history": "Esta obra esteve em...",
  "unique_hash": "550e8400-e29b-41d4-a716-446655440000",
  "artwork": {
    "id": 5,
    "title": "Névoa Dourada",
    "image_url": "http://localhost:8000/storage/..."
  }
}
```

---

### GET /admin/experiences 🔒

Lista todas as experiências com obra vinculada.

**Resposta 200**
```json
{
  "data": [
    {
      "id": 1,
      "buyer_name": "João Silva",
      "unique_hash": "550e8400...",
      "dedication": null,
      "creation_video_url": null,
      "exhibition_history": null,
      "artwork": { "id": 5, "title": "Névoa Dourada" }
    }
  ]
}
```

---

### GET /admin/experiences/{id} 🔒

Retorna uma experiência pelo ID com obra completa.

---

### PUT /admin/experiences/{id} 🔒

Atualiza o conteúdo da experiência.

**Body (JSON)**
```json
{
  "dedication": "Para você, que escolheu guardar este momento...",
  "creation_video_url": "https://youtube.com/watch?v=...",
  "exhibition_history": "Esta obra participou da exposição..."
}
```

**Resposta 200** — experiência atualizada

---

## Pedidos (Orders)

### GET /orders/{id}/status

Retorna o status de pagamento de um pedido (público — usado para polling de PIX/boleto).

**Resposta 200**
```json
{
  "order_id": 42,
  "status": "approved",
  "payment_method": "pix",
  "shipping_status": "pending",
  "experience_hash": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Status de pagamento:** `pending`, `approved`, `rejected`, `cancelled`

**Status de envio:** `pending`, `shipped`, `delivered`

---

### GET /admin/orders 🔒

Lista todos os pedidos paginados (30 por página).

**Resposta 200**
```json
{
  "data": [
    {
      "id": 42,
      "buyer_name": "João Silva",
      "buyer_email": "joao@email.com",
      "status": "approved",
      "amount": "5500.00",
      "shipping_cost": "89.90",
      "shipping_status": "pending",
      "shipping_tracking_code": null,
      "mp_payment_method": "pix",
      "artwork": { "id": 5, "title": "Névoa Dourada" },
      "acquired_experience": {
        "id": 1,
        "dedication": null,
        "unique_hash": "550e8400..."
      },
      "created_at": "2026-05-12T14:00:00Z"
    }
  ]
}
```

---

### GET /admin/orders/{id} 🔒

Retorna um pedido completo com obra e experiência.

---

### PATCH /admin/orders/{id}/shipping 🔒

Atualiza o status de envio e código de rastreamento.

**Body (JSON)**
```json
{
  "shipping_status": "shipped",
  "shipping_tracking_code": "BR123456789SP",
  "mp_shipment_id": null
}
```

**Valores de `shipping_status`:** `pending`, `shipped`, `delivered`

---

### PUT /admin/orders/{id}/experience 🔒

Preenche e/ou publica a experiência do pedido.

**Body (JSON)**
```json
{
  "dedication": "Texto personalizado para o comprador...",
  "creation_video_url": "https://youtube.com/watch?v=...",
  "exhibition_history": "Esta obra esteve em...",
  "publish": true
}
```

> Quando `publish: true`, o sistema envia o e-mail com o link da experiência para o comprador e registra `experience_published_at`.

---

## Checkout (Público)

### GET /checkout/shipping

Calcula opções de frete para uma obra.

**Query params**
| Param | Tipo | Obrigatório |
|-------|------|-------------|
| `artwork_id` | integer | ✅ |
| `zip_code` | string | ✅ (só dígitos) |

**Resposta 200**
```json
[
  {
    "id": "1",
    "name": "SEDEX",
    "cost": 89.90,
    "estimated_days": "2 dias úteis"
  },
  {
    "id": "2",
    "name": "PAC",
    "cost": 42.50,
    "estimated_days": "8 dias úteis"
  }
]
```

---

### POST /checkout

Processa o pagamento de uma obra via Mercado Pago.

**Body (JSON)**
```json
{
  "artwork_id": 5,
  "payment_method": "credit_card",
  "buyer_name": "João Silva",
  "buyer_email": "joao@email.com",
  "buyer_cpf": "000.000.000-00",
  "buyer_phone": "(11) 99999-9999",
  "buyer_message": "Mensagem opcional para a artista",
  "billing_address": {
    "zip_code": "01310-100",
    "street": "Av. Paulista",
    "number": "1000",
    "complement": "Apto 42",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP"
  },
  "shipping_address": {
    "zip_code": "01310-100",
    "street": "Av. Paulista",
    "number": "1000",
    "complement": "",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP"
  },
  "shipping_option": "SEDEX",
  "shipping_cost": 89.90,
  "card_token": "token-gerado-pelo-mp-bricks",
  "payment_method_id": "visa",
  "installments": 1
}
```

**Resposta 200**
```json
{
  "order_id": 42,
  "status": "approved"
}
```

**Rate limit:** 30 requisições/minuto por IP.

---

## Webhooks

### POST /webhooks/mercadopago

Recebe notificações do Mercado Pago (IPN). Endpoint exclusivo para o MP.

**Rate limit:** 60 requisições/minuto.

---

## Códigos de erro

| Código | Significado |
|--------|-------------|
| `400` | Dados inválidos (validação) |
| `401` | Não autenticado — token ausente ou expirado |
| `403` | Sem permissão |
| `404` | Recurso não encontrado |
| `422` | Erro de validação com detalhes |
| `429` | Rate limit excedido |
| `500` | Erro interno do servidor |

**Formato de erro 422:**
```json
{
  "message": "The title field is required.",
  "errors": {
    "title": ["The title field is required."]
  }
}
```

---

## Gerar token de serviço (para n8n / OpenClaw)

Execute no servidor para criar um token de longa duração:

```bash
php artisan tinker
```

```php
$user = \App\Models\User::where('email', 'admin@zefirus.com')->first();
echo $user->createToken('n8n-service')->plainTextToken;
```

Salve o token gerado apenas no `.env` do n8n como `LARAVEL_SERVICE_TOKEN`. Nunca compartilhe no chat ou em repositórios.
