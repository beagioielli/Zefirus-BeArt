# Checkout Transparente — Mercado Pago (Zefirus BeArt)

**Data:** 2026-05-11  
**Status:** Aprovado  
**Escopo:** Integração completa de checkout transparente com Mercado Pago Bricks para a plataforma Zefirus BeArt (e-commerce de arte exclusiva de Beatriz Gioielli).

---

## 1. Visão Geral

Substituir os stubs de pagamento existentes por uma integração real com o Mercado Pago, usando **MP Bricks** no frontend para tokenização segura e o **SDK PHP oficial** no backend para criação e gestão de pagamentos. O checkout suporta cartão de crédito, PIX e boleto bancário, com frete calculado automaticamente via Mercado Envios.

---

## 2. Métodos de Pagamento

- Cartão de crédito (resposta imediata)
- PIX (QR code, polling de status)
- Boleto bancário (geração imediata, compensação em até 3 dias úteis)

---

## 3. Arquitetura

```
Comprador (Browser)
  │
  ├─ Formulário de dados pessoais (Step 1)
  ├─ Seleção de frete via GET /api/checkout/shipping (Step 2)
  ├─ MP Bricks renderiza formulário de pagamento (Step 3)
  │   └─ Tokeniza cartão via iframe seguro — dado bruto nunca passa pelo backend
  │
  └─ POST /api/checkout
        └─ PaymentService → SDK PHP MP → cria Payment
              └─ Salva Order no banco → retorna status + dados de redirect

Webhook POST /api/webhooks/mercadopago
  ├─ topic: "payment"
  │     ├─ Valida assinatura HMAC (x-signature)
  │     ├─ Verifica idempotência (mp_payment_id já processado?)
  │     ├─ Atualiza Order.status
  │     └─ Se approved:
  │           ├─ Artwork.is_sold = true
  │           ├─ Cria AcquiredExperience (UUID gerado, campos ricos vazios)
  │           ├─ Email comprador: confirmação de compra
  │           └─ Email Beatriz: nova venda
  │
  └─ topic: "shipments"
        ├─ Atualiza Order.shipping_status
        └─ Se delivered + AcquiredExperience preenchida:
              └─ Email comprador: obra entregue + link /experience/{hash}
```

---

## 4. Banco de Dados

### 4.1 Tabela `orders` (nova)

```sql
id                        bigint PK
artwork_id                FK → artworks.id
mp_payment_id             string          -- ID retornado pelo MP
mp_shipment_id            string nullable -- ID do envio Mercado Envios
mp_payment_method         enum: card | pix | boleto
status                    enum: pending | approved | rejected | cancelled
amount                    decimal(10,2)   -- valor da obra
shipping_cost             decimal(10,2) nullable
-- Comprador
buyer_name                string
buyer_email               string
buyer_cpf                 string
buyer_phone               string
buyer_message             text nullable   -- "mensagem para a artista"
billing_address           json            -- endereço de cobrança
shipping_address          json            -- endereço de entrega (pode diferir)
-- Envio
shipping_option           string nullable -- ex: "SEDEX", "PAC"
shipping_tracking_code    string nullable
shipping_status           enum: pending | shipped | delivered nullable
-- PIX
pix_qr_code               text nullable   -- base64
pix_qr_code_text          string nullable -- copia-e-cola
-- Boleto
boleto_url                string nullable
boleto_barcode            string nullable
-- Pós-venda
acquired_experience_id    FK → acquired_experiences.id nullable
created_at / updated_at
```

### 4.2 Campos novos em `artworks` (migration)

```sql
shipping_weight   decimal(5,2)  -- peso da embalagem em kg
shipping_height   integer        -- altura em cm
shipping_width    integer        -- largura em cm
shipping_length   integer        -- comprimento em cm
```

### 4.3 Tabela `acquired_experiences` — sem alteração de schema

O fluxo de criação muda: a `AcquiredExperience` é criada automaticamente quando `Order.status = approved`, mas com campos ricos (`dedication`, `creation_video_url`, `exhibition_history`) vazios. A Beatriz preenche esses campos pelo painel admin antes do envio da obra. O e-mail com o link da Experiência só é disparado quando o webhook de `shipments` confirmar `delivered`.

---

## 5. Endpoints

### Público

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/checkout/shipping` | Calcula opções de frete. Params: `artwork_id`, `zip_code` |
| POST | `/api/checkout` | Cria pagamento. Body: dados comprador + token MP + shipping_option |
| GET | `/api/orders/{id}/status` | Polling de status (PIX/boleto). Retorna `status`, `shipping_status` |
| POST | `/api/webhooks/mercadopago` | Receptor de webhooks MP (payment + shipments) |

### Admin (auth:sanctum)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/orders` | Lista todos os pedidos |
| GET | `/api/admin/orders/{id}` | Detalhes de um pedido |
| PATCH | `/api/admin/orders/{id}/shipping` | Atualiza tracking_code e shipping_status |
| PUT | `/api/admin/orders/{id}/experience` | Preenche conteúdo da AcquiredExperience |

---

## 6. Fluxos por Método de Pagamento

### Cartão de Crédito
1. Comprador preenche formulário + Bricks tokeniza cartão
2. Frontend envia token + dados → `POST /api/checkout`
3. Backend cria payment via SDK PHP → resposta imediata (approved/rejected)
4. Se approved → redirect `/pedido/{id}/confirmado`
5. Emails disparados: confirmação ao comprador + notificação à Beatriz

### PIX
1. Frontend envia dados → `POST /api/checkout`
2. Backend cria payment PIX → retorna `pix_qr_code` + `pix_qr_code_text`
3. Redirect `/pedido/{id}` → exibe QR code + copia-e-cola
4. Frontend faz polling `GET /api/orders/{id}/status` a cada 5 segundos
5. Webhook MP (`topic: payment`, `status: approved`) atualiza Order
6. Próximo polling detecta `approved` → redirect `/pedido/{id}/confirmado`
7. Emails disparados: confirmação ao comprador + notificação à Beatriz

### Boleto
1. Frontend envia dados → `POST /api/checkout`
2. Backend cria payment boleto → retorna `boleto_url` + `boleto_barcode`
3. Redirect `/pedido/{id}` → exibe link do boleto + código de barras
4. **Email imediato ao comprador:** "Seu boleto foi gerado" com link e código de barras
5. Webhook MP (`topic: payment`, `status: approved`) atualiza Order quando pago
6. **Email de confirmação ao comprador** quando aprovado

### Entrega e Experiência
1. Beatriz envia a obra → atualiza tracking no painel admin
2. Beatriz preenche `AcquiredExperience` (dedicatória, vídeo, histórico) no painel
3. Webhook MP (`topic: shipments`, `status: delivered`) detecta entrega e atualiza `Order.shipping_status = delivered`
4. Sistema verifica se `AcquiredExperience` tem `dedication` preenchida (indicador de que o admin finalizou o conteúdo)
5. Se preenchida → **Email ao comprador:** "Sua obra chegou" + link `/experience/{hash}`
6. Se não preenchida → Order fica com `shipping_status = delivered` mas sem email. Admin verá alerta no painel para preencher e publicar manualmente (botão "Publicar Experiência" no `AdminOrderDetail`), que dispara o email na hora.

---

## 7. Segurança

- **Tokenização no browser:** dados do cartão nunca trafegam pelo backend (PCI-DSS via Bricks)
- **Validação HMAC:** webhook valida `x-signature` do MP com `MP_WEBHOOK_SECRET`
- **Idempotência:** antes de processar, verifica se `mp_payment_id` já existe na tabela `orders`
- **Race condition:** uso de `DB::transaction` + `lockForUpdate()` ao verificar `is_sold` antes de criar Order
- **Variáveis de ambiente:** credenciais nunca commitadas, apenas `.env.example` atualizado

---

## 8. E-mails

| Mail Class | Destinatário | Gatilho |
|------------|-------------|---------|
| `OrderConfirmed` | Comprador | Payment approved (cartão/PIX/boleto) |
| `BoletoGenerated` | Comprador | Criação do boleto (imediato) |
| `AdminNewSale` | Beatriz (admin) | Payment approved |
| `ExperienceReady` | Comprador | Shipment delivered + Experience preenchida |

Todos os envios são enfileirados via `QUEUE_CONNECTION=database` (já configurado).

---

## 9. Variáveis de Ambiente

### Backend (`backend/.env`)
```env
MP_ACCESS_TOKEN=TEST-4272098220894575-051119-...
MP_PUBLIC_KEY=TEST-994fa8f0-d6fd-4937-83be-b962b65ab12f
MP_WEBHOOK_SECRET=chave_hmac_configurada_no_painel_mp
MP_SELLER_ZIP_CODE=00000000
MP_ADMIN_EMAIL=beatriz@zefirus.com
```

### Frontend (`frontend/.env`)
```env
VITE_MP_PUBLIC_KEY=TEST-994fa8f0-d6fd-4937-83be-b962b65ab12f
VITE_API_URL=http://localhost:8000/api
```

> Em produção, usar as credenciais live (sem prefixo `TEST-`). Configurar URL do webhook no painel MP Dev apontando para `https://dominio.com.br/api/webhooks/mercadopago`. Em desenvolvimento, usar ngrok.

---

## 10. Dependências

| Ambiente | Pacote | Ação |
|----------|--------|------|
| Backend | `mercadopago/dx-php` | Instalar via Composer |
| Frontend | `@mercadopago/sdk-react ^1.0.7` | Já instalado |

---

## 11. Arquivos Afetados

### Existentes — modificados

| Arquivo | Mudança |
|---------|---------|
| `backend/app/Http/Controllers/Api/PaymentController.php` | Implementação real de `checkout()` e `webhook()` |
| `backend/app/Services/PaymentService.php` | Substituído por implementação real com SDK PHP |
| `backend/app/Http/Controllers/Api/AdminArtworkController.php` | Adicionar validação e handling dos campos `shipping_*` |
| `backend/app/Models/Artwork.php` | Adicionar cast dos campos de embalagem |
| `backend/routes/api.php` | Novas rotas: shipping, orders, admin/orders |
| `frontend/src/lib/api.ts` | `VITE_API_URL` substitui URL hardcoded |
| `frontend/src/App.tsx` | Novas rotas: `/pedido/:id`, `/pedido/:id/confirmado`, admin orders |
| `frontend/src/pages/Checkout.tsx` | Reescrita completa com formulário multi-step + Bricks |
| `frontend/src/pages/admin/AdminArtworkEdit.tsx` | Campos de embalagem (peso, dimensões) |

### Novos — criados

| Arquivo | O que é |
|---------|---------|
| `backend/app/Models/Order.php` | Model Order com relacionamentos |
| `backend/app/Http/Controllers/Api/OrderController.php` | Status polling + admin CRUD |
| `backend/app/Http/Controllers/Api/ShippingController.php` | Cálculo de frete via MP Envios |
| `backend/app/Mail/OrderConfirmed.php` | Mailable: compra aprovada |
| `backend/app/Mail/BoletoGenerated.php` | Mailable: boleto gerado |
| `backend/app/Mail/AdminNewSale.php` | Mailable: nova venda para Beatriz |
| `backend/app/Mail/ExperienceReady.php` | Mailable: obra entregue + link experiência |
| `backend/resources/views/mail/*.blade.php` | Templates HTML dos 4 e-mails |
| `backend/database/migrations/..._create_orders_table.php` | Migration da tabela orders |
| `backend/database/migrations/..._add_shipping_fields_to_artworks.php` | Migration campos embalagem |
| `frontend/src/pages/OrderPending.tsx` | Página de aguardo (PIX QR / boleto link) |
| `frontend/src/pages/OrderSuccess.tsx` | Página de compra confirmada |
| `frontend/src/pages/admin/AdminOrders.tsx` | Listagem de pedidos no admin |
| `frontend/src/pages/admin/AdminOrderDetail.tsx` | Detalhes do pedido + edição da Experiência |

---

## 12. Fora do Escopo

- Cálculo de frete manual ou integração com APIs dos Correios diretamente (usa exclusivamente Mercado Envios)
- Parcelamento com juros (configurável no painel MP, não requer código)
- Reembolsos / estornos automáticos (tratados manualmente pelo painel MP)
- Multi-obra por pedido (cada checkout é para uma obra única)
