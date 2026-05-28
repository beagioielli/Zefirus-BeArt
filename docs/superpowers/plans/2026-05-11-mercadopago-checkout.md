# Checkout Transparente Mercado Pago Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar checkout transparente completo com Mercado Pago Bricks (cartão, PIX, boleto), frete via Mercado Envios, e fluxo pós-venda automatizado (emails, AcquiredExperience, link da Experiência na entrega).

**Architecture:** MP Bricks tokeniza o cartão no browser (PCI-DSS); Laravel processa pagamentos via SDK PHP, valida webhooks por HMAC, e gerencia o ciclo de vida do pedido. Dois tópicos de webhook: `payment` (aprovação/rejeição) e `shipments` (rastreio de entrega). O link da Experiência é enviado apenas quando a entrega for confirmada pelo Mercado Envios e o admin tiver preenchido o conteúdo.

**Tech Stack:** Laravel 12, `mercadopago/dx-php`, `@mercadopago/sdk-react ^1.0.7`, React 19, TypeScript, Tailwind CSS, SQLite (dev), PHPUnit

**Spec:** `docs/superpowers/specs/2026-05-11-mercadopago-checkout-design.md`

---

## Mapa de Arquivos

### Backend — criados
- `backend/app/Models/Order.php`
- `backend/app/Services/PaymentService.php` (substituição completa)
- `backend/app/Http/Controllers/Api/PaymentController.php` (substituição completa)
- `backend/app/Http/Controllers/Api/ShippingController.php`
- `backend/app/Http/Controllers/Api/OrderController.php`
- `backend/app/Mail/OrderConfirmed.php`
- `backend/app/Mail/BoletoGenerated.php`
- `backend/app/Mail/AdminNewSale.php`
- `backend/app/Mail/ExperienceReady.php`
- `backend/resources/views/mail/order-confirmed.blade.php`
- `backend/resources/views/mail/boleto-generated.blade.php`
- `backend/resources/views/mail/admin-new-sale.blade.php`
- `backend/resources/views/mail/experience-ready.blade.php`
- `backend/database/migrations/..._create_orders_table.php`
- `backend/database/migrations/..._add_shipping_fields_to_artworks.php`
- `backend/database/factories/OrderFactory.php`
- `backend/database/factories/ArtworkFactory.php`
- `backend/tests/Feature/CheckoutTest.php`
- `backend/tests/Feature/WebhookTest.php`

### Backend — modificados
- `backend/config/services.php` — adiciona bloco `mercadopago`
- `backend/routes/api.php` — novas rotas
- `backend/app/Models/Artwork.php` — casts dos campos de embalagem
- `backend/app/Http/Controllers/Api/AdminArtworkController.php` — validação dos campos shipping_*
- `backend/.env` e `.env.example` — variáveis MP_*

### Frontend — criados
- `frontend/src/pages/OrderPending.tsx`
- `frontend/src/pages/OrderSuccess.tsx`
- `frontend/src/pages/admin/AdminOrders.tsx`
- `frontend/src/pages/admin/AdminOrderDetail.tsx`
- `frontend/.env`
- `frontend/.env.example`

### Frontend — modificados
- `frontend/src/pages/Checkout.tsx` (reescrita completa)
- `frontend/src/pages/admin/AdminArtworkEdit.tsx` — campos de embalagem
- `frontend/src/lib/api.ts` — VITE_API_URL
- `frontend/src/App.tsx` — novas rotas

---

## Task 1: Instalar SDK PHP + Configurar Services

**Files:**
- Modify: `backend/composer.json` (via composer require)
- Modify: `backend/config/services.php`
- Modify: `backend/.env`
- Modify: `backend/.env.example`

- [ ] **Step 1: Instalar o SDK PHP do Mercado Pago**

```bash
cd backend
composer require mercadopago/dx-php
```

Expected: `./composer.lock has been updated` sem erros.

- [ ] **Step 2: Adicionar bloco mercadopago em `config/services.php`**

Adicionar ao array de retorno do arquivo `backend/config/services.php`:

```php
'mercadopago' => [
    'access_token'   => env('MP_ACCESS_TOKEN'),
    'public_key'     => env('MP_PUBLIC_KEY'),
    'webhook_secret' => env('MP_WEBHOOK_SECRET'),
    'seller_zip'     => env('MP_SELLER_ZIP_CODE'),
    'admin_email'    => env('MP_ADMIN_EMAIL', 'beatriz@zefirus.com'),
],
```

- [ ] **Step 3: Adicionar variáveis ao `backend/.env`**

```env
MP_ACCESS_TOKEN=TEST-4272098220894575-051119-7d28fa50ca9f00f19ab53b322fe08a50-247661218
MP_PUBLIC_KEY=TEST-994fa8f0-d6fd-4937-83be-b962b65ab12f
MP_WEBHOOK_SECRET=gerar_uma_chave_aleatoria_forte_aqui
MP_SELLER_ZIP_CODE=00000000
MP_ADMIN_EMAIL=beatriz@zefirus.com
```

> Para `MP_WEBHOOK_SECRET`, gere com: `php -r "echo bin2hex(random_bytes(32));"`

- [ ] **Step 4: Adicionar ao `backend/.env.example`**

```env
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=
MP_SELLER_ZIP_CODE=
MP_ADMIN_EMAIL=
```

- [ ] **Step 5: Limpar cache de config e verificar**

```bash
cd backend
php artisan config:clear
php artisan tinker --execute="echo config('services.mercadopago.access_token');"
```

Expected: imprime o token (não vazio).

- [ ] **Step 6: Commit**

```bash
cd backend
git add composer.json composer.lock config/services.php .env.example
git commit -m "feat: install mercadopago/dx-php and configure services"
```

---

## Task 2: Migrations — Tabela orders + Campos de Embalagem

**Files:**
- Create: `backend/database/migrations/YYYY_MM_DD_HHMMSS_create_orders_table.php`
- Create: `backend/database/migrations/YYYY_MM_DD_HHMMSS_add_shipping_fields_to_artworks.php`

- [ ] **Step 1: Gerar as migrations**

```bash
cd backend
php artisan make:migration create_orders_table
php artisan make:migration add_shipping_fields_to_artworks_table
```

Anote os nomes gerados (incluem timestamp).

- [ ] **Step 2: Implementar a migration de orders**

Substitua o conteúdo do arquivo `create_orders_table.php` gerado:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artwork_id')->constrained()->cascadeOnDelete();
            $table->foreignId('acquired_experience_id')->nullable()->constrained()->nullOnDelete();

            // Mercado Pago
            $table->string('mp_payment_id')->nullable()->unique();
            $table->string('mp_shipment_id')->nullable();
            $table->string('mp_payment_method')->default('card'); // card | pix | boleto

            // Status
            $table->string('status')->default('pending'); // pending | approved | rejected | cancelled

            // Valores
            $table->decimal('amount', 10, 2);
            $table->decimal('shipping_cost', 10, 2)->nullable();

            // Comprador
            $table->string('buyer_name');
            $table->string('buyer_email');
            $table->string('buyer_cpf');
            $table->string('buyer_phone');
            $table->text('buyer_message')->nullable();
            $table->text('billing_address');  // JSON stored as text (SQLite compat)
            $table->text('shipping_address'); // JSON stored as text (SQLite compat)

            // Envio
            $table->string('shipping_option')->nullable(); // SEDEX, PAC etc
            $table->string('shipping_tracking_code')->nullable();
            $table->string('shipping_status')->nullable(); // pending | shipped | delivered

            // PIX
            $table->text('pix_qr_code')->nullable();
            $table->text('pix_qr_code_text')->nullable();

            // Boleto
            $table->text('boleto_url')->nullable();
            $table->string('boleto_barcode')->nullable();

            // Controle de experiência
            $table->timestamp('experience_published_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
```

- [ ] **Step 3: Implementar a migration de campos de embalagem**

Substitua o conteúdo do arquivo `add_shipping_fields_to_artworks_table.php` gerado:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artworks', function (Blueprint $table) {
            $table->decimal('shipping_weight', 5, 2)->nullable(); // kg
            $table->integer('shipping_height')->nullable();        // cm
            $table->integer('shipping_width')->nullable();         // cm
            $table->integer('shipping_length')->nullable();        // cm
        });
    }

    public function down(): void
    {
        Schema::table('artworks', function (Blueprint $table) {
            $table->dropColumn(['shipping_weight', 'shipping_height', 'shipping_width', 'shipping_length']);
        });
    }
};
```

- [ ] **Step 4: Executar as migrations**

```bash
cd backend
php artisan migrate
```

Expected: `Running migrations... DONE` para ambas as migrations.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/
git commit -m "feat: add orders table and artwork shipping fields migrations"
```

---

## Task 3: Models — Order + Atualizar Artwork

**Files:**
- Create: `backend/app/Models/Order.php`
- Create: `backend/database/factories/ArtworkFactory.php`
- Create: `backend/database/factories/OrderFactory.php`
- Modify: `backend/app/Models/Artwork.php`

- [ ] **Step 1: Criar o model Order**

```php
<?php
// backend/app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'amount'               => 'decimal:2',
        'shipping_cost'        => 'decimal:2',
        'billing_address'      => 'array',
        'shipping_address'     => 'array',
        'experience_published_at' => 'datetime',
    ];

    public function artwork()
    {
        return $this->belongsTo(Artwork::class);
    }

    public function acquiredExperience()
    {
        return $this->belongsTo(AcquiredExperience::class);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function experiencePublished(): bool
    {
        return $this->experience_published_at !== null;
    }
}
```

- [ ] **Step 2: Atualizar Artwork model com casts dos campos de embalagem**

No arquivo `backend/app/Models/Artwork.php`, substitua o método `$casts` existente:

```php
protected $casts = [
    'price'           => 'decimal:2',
    'is_sold'         => 'boolean',
    'shipping_weight' => 'decimal:2',
];
```

- [ ] **Step 3: Criar ArtworkFactory**

```php
<?php
// backend/database/factories/ArtworkFactory.php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ArtworkFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title'           => fake()->sentence(3),
            'description'     => fake()->paragraph(),
            'dimensions'      => '50x70cm',
            'price'           => fake()->randomFloat(2, 500, 15000),
            'stock'           => 1,
            'is_sold'         => false,
            'shipping_weight' => 2.5,
            'shipping_height' => 10,
            'shipping_width'  => 60,
            'shipping_length' => 80,
        ];
    }

    public function sold(): static
    {
        return $this->state(fn ($a) => ['is_sold' => true]);
    }
}
```

- [ ] **Step 4: Criar OrderFactory**

```php
<?php
// backend/database/factories/OrderFactory.php

namespace Database\Factories;

use App\Models\Artwork;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        $address = [
            'zip_code'      => '01310100',
            'street'        => fake()->streetName(),
            'number'        => fake()->buildingNumber(),
            'complement'    => null,
            'neighborhood'  => 'Centro',
            'city'          => 'São Paulo',
            'state'         => 'SP',
        ];

        return [
            'artwork_id'         => Artwork::factory(),
            'mp_payment_id'      => 'mp_' . fake()->uuid(),
            'mp_payment_method'  => 'card',
            'status'             => 'pending',
            'amount'             => fake()->randomFloat(2, 500, 15000),
            'shipping_cost'      => 35.90,
            'buyer_name'         => fake()->name(),
            'buyer_email'        => fake()->safeEmail(),
            'buyer_cpf'          => '12345678900',
            'buyer_phone'        => '11999999999',
            'buyer_message'      => null,
            'billing_address'    => $address,
            'shipping_address'   => $address,
            'shipping_option'    => 'SEDEX',
            'shipping_status'    => 'pending',
        ];
    }

    public function approved(): static
    {
        return $this->state(fn ($a) => ['status' => 'approved']);
    }

    public function pix(): static
    {
        return $this->state(fn ($a) => [
            'mp_payment_method' => 'pix',
            'pix_qr_code'       => 'base64_qr_code_example',
            'pix_qr_code_text'  => '00020126580014br.gov.bcb.pix',
        ]);
    }

    public function boleto(): static
    {
        return $this->state(fn ($a) => [
            'mp_payment_method' => 'boleto',
            'boleto_url'        => 'https://www.mercadopago.com.br/boleto/example',
            'boleto_barcode'    => '23793.38128 60007.827136 96000.063305 3 93330000050000',
        ]);
    }
}
```

- [ ] **Step 5: Verificar que factories funcionam**

```bash
cd backend
php artisan tinker --execute="use App\Models\Order; use App\Models\Artwork; echo Order::factory()->make()->buyer_name;"
```

Expected: imprime um nome sem erros.

- [ ] **Step 6: Commit**

```bash
git add app/Models/Order.php app/Models/Artwork.php database/factories/
git commit -m "feat: add Order model and factories"
```

---

## Task 4: PaymentService — Implementação Real

**Files:**
- Modify: `backend/app/Services/PaymentService.php` (substituição completa)

- [ ] **Step 1: Substituir PaymentService.php completamente**

```php
<?php
// backend/app/Services/PaymentService.php

namespace App\Services;

use App\Models\Order;
use App\Models\Artwork;
use App\Models\AcquiredExperience;
use App\Mail\OrderConfirmed;
use App\Mail\BoletoGenerated;
use App\Mail\AdminNewSale;
use App\Mail\ExperienceReady;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Payment\PaymentClient;

class PaymentService
{
    public function __construct()
    {
        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));
    }

    public function createPayment(array $data): array
    {
        $client = new PaymentClient();

        [$firstName, ...rest] = explode(' ', $data['buyer_name']);
        $lastName = implode(' ', $rest) ?: $firstName;

        $paymentData = [
            'transaction_amount' => (float) ($data['amount'] + ($data['shipping_cost'] ?? 0)),
            'description'        => $data['artwork_title'],
            'external_reference' => (string) $data['artwork_id'],
            'payer'              => [
                'email'          => $data['buyer_email'],
                'first_name'     => $firstName,
                'last_name'      => $lastName,
                'identification' => [
                    'type'   => 'CPF',
                    'number' => preg_replace('/\D/', '', $data['buyer_cpf']),
                ],
                'address' => [
                    'zip_code'      => $data['billing_address']['zip_code'],
                    'street_name'   => $data['billing_address']['street'],
                    'street_number' => $data['billing_address']['number'] ?? 'S/N',
                ],
            ],
        ];

        if ($data['payment_method'] === 'card') {
            $paymentData['token']              = $data['card_token'];
            $paymentData['installments']       = (int) ($data['installments'] ?? 1);
            $paymentData['payment_method_id']  = $data['payment_method_id'];
        } elseif ($data['payment_method'] === 'pix') {
            $paymentData['payment_method_id']  = 'pix';
        } elseif ($data['payment_method'] === 'boleto') {
            $paymentData['payment_method_id']  = 'bolbradesco';
            $paymentData['additional_info']    = [
                'payer' => [
                    'first_name' => $firstName,
                    'last_name'  => $lastName,
                    'phone'      => ['number' => $data['buyer_phone']],
                    'address'    => [
                        'zip_code'      => $data['billing_address']['zip_code'],
                        'street_name'   => $data['billing_address']['street'],
                        'street_number' => $data['billing_address']['number'] ?? 'S/N',
                        'neighborhood'  => $data['billing_address']['neighborhood'] ?? '',
                        'city'          => $data['billing_address']['city'],
                        'federal_unit'  => $data['billing_address']['state'],
                    ],
                ],
            ];
        }

        $payment = $client->create($paymentData);

        $result = [
            'mp_payment_id'     => $payment->id,
            'status'            => $payment->status,
            'payment_method'    => $data['payment_method'],
        ];

        if ($data['payment_method'] === 'pix') {
            $txData = $payment->point_of_interaction->transaction_data ?? null;
            $result['pix_qr_code']      = $txData->qr_code_base64 ?? null;
            $result['pix_qr_code_text'] = $txData->qr_code ?? null;
        }

        if ($data['payment_method'] === 'boleto') {
            $result['boleto_url']     = $payment->transaction_details->external_resource_url ?? null;
            $result['boleto_barcode'] = $payment->barcode->content ?? null;
        }

        return $result;
    }

    public function validateWebhookSignature(Request $request): bool
    {
        $signature = $request->header('x-signature');
        $requestId = $request->header('x-request-id', '');

        if (!$signature) {
            return false;
        }

        $parts = [];
        foreach (explode(',', $signature) as $part) {
            $kv = explode('=', $part, 2);
            if (count($kv) === 2) {
                $parts[$kv[0]] = $kv[1];
            }
        }

        $ts = $parts['ts'] ?? '';
        $v1 = $parts['v1'] ?? '';

        if (!$ts || !$v1) {
            return false;
        }

        $dataId  = $request->query('data_id', $request->input('data.id', ''));
        $secret  = config('services.mercadopago.webhook_secret');
        $manifest = "id:{$dataId};request-id:{$requestId};ts:{$ts};";
        $expected = hash_hmac('sha256', $manifest, $secret);

        return hash_equals($expected, $v1);
    }

    public function handleWebhook(Request $request): void
    {
        $topic  = $request->query('topic', $request->input('type', ''));
        $dataId = $request->query('data_id', $request->input('data.id', ''));

        if (in_array($topic, ['payment', 'payment.updated'])) {
            $this->handlePaymentWebhook((string) $dataId);
        } elseif ($topic === 'shipments') {
            $this->handleShipmentWebhook((string) $dataId);
        }
    }

    private function handlePaymentWebhook(string $mpPaymentId): void
    {
        // Idempotência: verifica se já foi processado como approved/rejected
        $order = Order::where('mp_payment_id', $mpPaymentId)->first();

        if (!$order || in_array($order->status, ['approved', 'rejected', 'cancelled'])) {
            return;
        }

        $client  = new PaymentClient();
        $payment = $client->get((int) $mpPaymentId);

        $order->update(['status' => $payment->status]);

        if ($payment->status === 'approved') {
            $this->onPaymentApproved($order);
        }
    }

    private function onPaymentApproved(Order $order): void
    {
        DB::transaction(function () use ($order) {
            // Marca obra como vendida
            $order->artwork->update(['is_sold' => true]);

            // Cria AcquiredExperience com campos ricos vazios
            $experience = AcquiredExperience::create([
                'artwork_id'  => $order->artwork_id,
                'buyer_name'  => $order->buyer_name,
                'unique_hash' => Str::uuid()->toString(),
            ]);

            $order->update(['acquired_experience_id' => $experience->id]);
        });

        // Emails (enfileirados)
        Mail::to($order->buyer_email)->queue(new OrderConfirmed($order));
        Mail::to(config('services.mercadopago.admin_email'))->queue(new AdminNewSale($order));
    }

    private function handleShipmentWebhook(string $shipmentId): void
    {
        $order = Order::where('mp_shipment_id', $shipmentId)->first();

        if (!$order) {
            // Tenta associar pelo artwork external_reference se shipment_id ainda não estava no order
            Log::info("Shipment webhook received for unknown shipment_id: {$shipmentId}");
            return;
        }

        // Busca status real do envio via ML API
        $response = \Illuminate\Support\Facades\Http::withToken(
            config('services.mercadopago.access_token')
        )->get("https://api.mercadolibre.com/shipments/{$shipmentId}");

        if (!$response->ok()) {
            return;
        }

        $status = $response->json('status');
        $order->update(['shipping_status' => $status]);

        if ($status === 'delivered' && $order->acquiredExperience) {
            $experience = $order->acquiredExperience;

            // Só envia se o admin já preencheu o conteúdo (dedication é o indicador)
            if ($experience->dedication && !$order->experiencePublished()) {
                $order->update(['experience_published_at' => now()]);
                Mail::to($order->buyer_email)->queue(new ExperienceReady($order, $experience));
            }
        }
    }

    public function publishExperience(Order $order): void
    {
        $order->update(['experience_published_at' => now()]);
        Mail::to($order->buyer_email)->queue(new ExperienceReady($order, $order->acquiredExperience));
    }
}
```

- [ ] **Step 2: Verificar sintaxe**

```bash
cd backend
php artisan route:list 2>&1 | head -5
```

Expected: sem erros de parse do PHP.

- [ ] **Step 3: Commit**

```bash
git add app/Services/PaymentService.php
git commit -m "feat: implement PaymentService with real Mercado Pago SDK"
```

---

## Task 5: ShippingController

**Files:**
- Create: `backend/app/Http/Controllers/Api/ShippingController.php`

- [ ] **Step 1: Criar ShippingController**

```php
<?php
// backend/app/Http/Controllers/Api/ShippingController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artwork;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ShippingController extends Controller
{
    public function options(Request $request)
    {
        $request->validate([
            'artwork_id' => 'required|integer|exists:artworks,id',
            'zip_code'   => ['required', 'string', 'regex:/^\d{8}$/'],
        ]);

        $artwork = Artwork::findOrFail($request->artwork_id);

        if (!$artwork->shipping_weight || !$artwork->shipping_height) {
            return response()->json(['error' => 'Dados de embalagem não configurados para esta obra.'], 422);
        }

        $sellerZip   = config('services.mercadopago.seller_zip');
        $weightGrams = (int) ($artwork->shipping_weight * 1000);
        $dimensions  = "{$artwork->shipping_height}x{$artwork->shipping_width}x{$artwork->shipping_length},{$weightGrams}";

        // Busca seller_id via token
        $meResponse = Http::withToken(config('services.mercadopago.access_token'))
            ->get('https://api.mercadolibre.com/users/me');

        if (!$meResponse->ok()) {
            return response()->json(['error' => 'Falha ao autenticar com Mercado Envios.'], 503);
        }

        $sellerId = $meResponse->json('id');

        $shippingResponse = Http::withToken(config('services.mercadopago.access_token'))
            ->get("https://api.mercadolibre.com/users/{$sellerId}/shipping_options", [
                'zip_code'   => $request->zip_code,
                'dimensions' => $dimensions,
                'from'       => $sellerZip,
            ]);

        if (!$shippingResponse->ok()) {
            return response()->json(['error' => 'Não foi possível calcular o frete.'], 503);
        }

        $options = collect($shippingResponse->json('options') ?? [])
            ->map(fn ($opt) => [
                'id'             => $opt['id'],
                'name'           => $opt['name'],
                'cost'           => $opt['list_cost'] ?? $opt['cost'] ?? 0,
                'estimated_days' => $this->formatDelivery($opt['estimated_delivery_time'] ?? []),
            ])
            ->values();

        return response()->json($options);
    }

    private function formatDelivery(array $delivery): string
    {
        $unit  = $delivery['unit'] ?? 'hour';
        $lower = $delivery['offset']['lower'] ?? 0;
        $upper = $delivery['offset']['upper'] ?? 0;

        if ($unit === 'hour') {
            $lowerDays = (int) ceil($lower / 24);
            $upperDays = (int) ceil($upper / 24);
            return $lowerDays === $upperDays
                ? "{$lowerDays} dia(s) útil(eis)"
                : "{$lowerDays}-{$upperDays} dias úteis";
        }

        return $lower === $upper ? "{$lower} dia(s) útil(eis)" : "{$lower}-{$upper} dias úteis";
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Controllers/Api/ShippingController.php
git commit -m "feat: add ShippingController for Mercado Envios options"
```

---

## Task 6: PaymentController + OrderController

**Files:**
- Modify: `backend/app/Http/Controllers/Api/PaymentController.php` (substituição)
- Create: `backend/app/Http/Controllers/Api/OrderController.php`

- [ ] **Step 1: Escrever os testes antes de implementar**

```php
<?php
// backend/tests/Feature/CheckoutTest.php

namespace Tests\Feature;

use App\Models\Artwork;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(int $artworkId, string $method = 'pix'): array
    {
        return [
            'artwork_id'      => $artworkId,
            'payment_method'  => $method,
            'buyer_name'      => 'João Silva',
            'buyer_email'     => 'joao@test.com',
            'buyer_cpf'       => '123.456.789-00',
            'buyer_phone'     => '11999999999',
            'billing_address' => [
                'zip_code'     => '01310100',
                'street'       => 'Av. Paulista',
                'number'       => '1000',
                'neighborhood' => 'Bela Vista',
                'city'         => 'São Paulo',
                'state'        => 'SP',
            ],
            'shipping_address' => [
                'zip_code'     => '01310100',
                'street'       => 'Av. Paulista',
                'number'       => '1000',
                'neighborhood' => 'Bela Vista',
                'city'         => 'São Paulo',
                'state'        => 'SP',
            ],
            'shipping_option' => 'SEDEX',
            'shipping_cost'   => 35.90,
        ];
    }

    public function test_checkout_returns_422_when_artwork_not_found(): void
    {
        $response = $this->postJson('/api/checkout', array_merge(
            $this->validPayload(9999),
            ['artwork_id' => 9999]
        ));

        $response->assertStatus(422);
    }

    public function test_checkout_returns_409_when_artwork_is_sold(): void
    {
        $artwork = Artwork::factory()->sold()->create();

        $response = $this->postJson('/api/checkout', $this->validPayload($artwork->id));

        $response->assertStatus(409)
            ->assertJson(['error' => 'Obra não disponível.']);
    }

    public function test_checkout_creates_order_and_returns_pix_data(): void
    {
        $artwork = Artwork::factory()->create(['price' => 1000]);

        $this->mock(PaymentService::class, function ($mock) {
            $mock->shouldReceive('createPayment')->once()->andReturn([
                'mp_payment_id'     => 'mp_test_123',
                'status'            => 'pending',
                'payment_method'    => 'pix',
                'pix_qr_code'       => 'base64_qr',
                'pix_qr_code_text'  => 'pix_copy_paste',
            ]);
        });

        $response = $this->postJson('/api/checkout', $this->validPayload($artwork->id, 'pix'));

        $response->assertStatus(201)
            ->assertJsonStructure(['order_id', 'status', 'pix_qr_code', 'pix_qr_code_text']);

        $this->assertDatabaseHas('orders', [
            'artwork_id'        => $artwork->id,
            'mp_payment_id'     => 'mp_test_123',
            'mp_payment_method' => 'pix',
            'status'            => 'pending',
        ]);
    }

    public function test_order_status_returns_correct_data(): void
    {
        $order = Order::factory()->pix()->create(['status' => 'pending']);

        $response = $this->getJson("/api/orders/{$order->id}/status");

        $response->assertStatus(200)
            ->assertJson([
                'status'         => 'pending',
                'payment_method' => 'pix',
            ]);
    }
}
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
cd backend
php artisan test tests/Feature/CheckoutTest.php
```

Expected: FAIL — `PaymentController` ainda usa stub.

- [ ] **Step 3: Substituir PaymentController.php**

```php
<?php
// backend/app/Http/Controllers/Api/PaymentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artwork;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $paymentService) {}

    public function checkout(Request $request)
    {
        $data = $request->validate([
            'artwork_id'        => 'required|integer|exists:artworks,id',
            'payment_method'    => 'required|in:card,pix,boleto',
            'buyer_name'        => 'required|string|max:255',
            'buyer_email'       => 'required|email',
            'buyer_cpf'         => ['required', 'string', 'regex:/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/'],
            'buyer_phone'       => 'required|string|max:20',
            'buyer_message'     => 'nullable|string|max:1000',
            'billing_address'   => 'required|array',
            'billing_address.zip_code'     => 'required|string',
            'billing_address.street'       => 'required|string',
            'billing_address.number'       => 'required|string',
            'billing_address.neighborhood' => 'required|string',
            'billing_address.city'         => 'required|string',
            'billing_address.state'        => 'required|string|size:2',
            'shipping_address'  => 'required|array',
            'shipping_address.zip_code'     => 'required|string',
            'shipping_address.street'       => 'required|string',
            'shipping_address.number'       => 'required|string',
            'shipping_address.neighborhood' => 'required|string',
            'shipping_address.city'         => 'required|string',
            'shipping_address.state'        => 'required|string|size:2',
            'shipping_option'   => 'required|string',
            'shipping_cost'     => 'required|numeric|min:0',
            // Cartão
            'card_token'        => 'required_if:payment_method,card|string',
            'payment_method_id' => 'required_if:payment_method,card|string',
            'installments'      => 'nullable|integer|min:1|max:12',
        ]);

        $artwork = DB::transaction(function () use ($data) {
            $artwork = Artwork::lockForUpdate()->findOrFail($data['artwork_id']);

            if ($artwork->is_sold) {
                abort(409, 'Obra não disponível.');
            }

            return $artwork;
        });

        $paymentResult = $this->paymentService->createPayment(array_merge($data, [
            'artwork_title' => $artwork->title,
            'amount'        => $artwork->price,
        ]));

        $order = Order::create([
            'artwork_id'         => $artwork->id,
            'mp_payment_id'      => $paymentResult['mp_payment_id'],
            'mp_payment_method'  => $data['payment_method'],
            'status'             => $paymentResult['status'],
            'amount'             => $artwork->price,
            'shipping_cost'      => $data['shipping_cost'],
            'buyer_name'         => $data['buyer_name'],
            'buyer_email'        => $data['buyer_email'],
            'buyer_cpf'          => $data['buyer_cpf'],
            'buyer_phone'        => $data['buyer_phone'],
            'buyer_message'      => $data['buyer_message'] ?? null,
            'billing_address'    => $data['billing_address'],
            'shipping_address'   => $data['shipping_address'],
            'shipping_option'    => $data['shipping_option'],
            'shipping_status'    => 'pending',
            'pix_qr_code'        => $paymentResult['pix_qr_code'] ?? null,
            'pix_qr_code_text'   => $paymentResult['pix_qr_code_text'] ?? null,
            'boleto_url'         => $paymentResult['boleto_url'] ?? null,
            'boleto_barcode'     => $paymentResult['boleto_barcode'] ?? null,
        ]);

        // Boleto: email imediato com dados do boleto
        if ($data['payment_method'] === 'boleto') {
            \Illuminate\Support\Facades\Mail::to($data['buyer_email'])
                ->queue(new \App\Mail\BoletoGenerated($order));
        }

        // Nota: para cartão aprovado imediatamente, o MP também dispara o webhook 'payment'.
        // A lógica de pós-venda (marcar is_sold, criar AcquiredExperience, emails) é processada
        // exclusivamente pelo webhook para garantir consistência em todos os métodos de pagamento.

        return response()->json([
            'order_id'        => $order->id,
            'status'          => $order->status,
            'payment_method'  => $order->mp_payment_method,
            'pix_qr_code'     => $order->pix_qr_code,
            'pix_qr_code_text'=> $order->pix_qr_code_text,
            'boleto_url'      => $order->boleto_url,
            'boleto_barcode'  => $order->boleto_barcode,
        ], 201);
    }

    public function webhook(Request $request)
    {
        if (!$this->paymentService->validateWebhookSignature($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $this->paymentService->handleWebhook($request);

        return response()->json(['message' => 'ok']);
    }
}
```

- [ ] **Step 4: Criar OrderController.php**

```php
<?php
// backend/app/Http/Controllers/Api/OrderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(protected PaymentService $paymentService) {}

    // Público: polling de status para PIX/boleto
    public function status($id)
    {
        $order = Order::findOrFail($id);

        return response()->json([
            'order_id'        => $order->id,
            'status'          => $order->status,
            'payment_method'  => $order->mp_payment_method,
            'shipping_status' => $order->shipping_status,
            'experience_hash' => $order->acquiredExperience?->unique_hash,
        ]);
    }

    // Admin: lista pedidos
    public function index()
    {
        $orders = Order::with(['artwork:id,title', 'acquiredExperience:id,dedication,unique_hash'])
            ->latest()
            ->paginate(30);

        return response()->json($orders);
    }

    // Admin: detalhes de um pedido
    public function show($id)
    {
        $order = Order::with(['artwork', 'acquiredExperience'])->findOrFail($id);
        return response()->json($order);
    }

    // Admin: atualizar envio (tracking + status)
    public function updateShipping(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $data = $request->validate([
            'shipping_tracking_code' => 'nullable|string|max:100',
            'shipping_status'        => 'required|in:pending,shipped,delivered',
            'mp_shipment_id'         => 'nullable|string',
        ]);

        $order->update($data);

        return response()->json($order->fresh());
    }

    // Admin: preencher/publicar AcquiredExperience
    public function updateExperience(Request $request, $id)
    {
        $order = Order::with('acquiredExperience')->findOrFail($id);

        abort_unless($order->acquiredExperience, 404, 'Experiência não encontrada para este pedido.');

        $data = $request->validate([
            'dedication'        => 'nullable|string|max:2000',
            'creation_video_url'=> 'nullable|url',
            'exhibition_history'=> 'nullable|string|max:5000',
            'publish'           => 'boolean',
        ]);

        $order->acquiredExperience->update([
            'dedication'         => $data['dedication'] ?? $order->acquiredExperience->dedication,
            'creation_video_url' => $data['creation_video_url'] ?? $order->acquiredExperience->creation_video_url,
            'exhibition_history' => $data['exhibition_history'] ?? $order->acquiredExperience->exhibition_history,
        ]);

        if (!empty($data['publish']) && !$order->experiencePublished()) {
            $this->paymentService->publishExperience($order);
        }

        return response()->json($order->fresh()->load('acquiredExperience'));
    }
}
```

- [ ] **Step 5: Rodar os testes**

```bash
cd backend
php artisan test tests/Feature/CheckoutTest.php
```

Expected: todos PASS.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Api/PaymentController.php app/Http/Controllers/Api/OrderController.php tests/Feature/CheckoutTest.php
git commit -m "feat: implement PaymentController checkout and OrderController"
```

---

## Task 7: Testes do Webhook

**Files:**
- Create: `backend/tests/Feature/WebhookTest.php`

- [ ] **Step 1: Criar WebhookTest.php**

```php
<?php
// backend/tests/Feature/WebhookTest.php

namespace Tests\Feature;

use App\Models\Artwork;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_returns_403_without_signature(): void
    {
        $response = $this->postJson('/api/webhooks/mercadopago', []);
        $response->assertStatus(403);
    }

    public function test_webhook_processes_payment_approved(): void
    {
        Mail::fake();

        $artwork = Artwork::factory()->create(['price' => 1000]);
        $order   = Order::factory()->create([
            'artwork_id'    => $artwork->id,
            'status'        => 'pending',
            'mp_payment_id' => 'mp_real_123',
        ]);

        // Mock para bypassar assinatura e chamada ao MP
        $this->mock(PaymentService::class, function ($mock) use ($order) {
            $mock->shouldReceive('validateWebhookSignature')->andReturn(true);
            $mock->shouldReceive('handleWebhook')->once()->andReturnUsing(function () use ($order) {
                $order->artwork->update(['is_sold' => true]);
                $order->update(['status' => 'approved']);
            });
        });

        $response = $this->postJson(
            '/api/webhooks/mercadopago?topic=payment&data_id=mp_real_123',
            ['type' => 'payment', 'data' => ['id' => 'mp_real_123']]
        );

        $response->assertStatus(200)->assertJson(['message' => 'ok']);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'approved']);
        $this->assertDatabaseHas('artworks', ['id' => $artwork->id, 'is_sold' => true]);
    }

    public function test_webhook_is_idempotent_for_already_approved_order(): void
    {
        $order = Order::factory()->approved()->create(['mp_payment_id' => 'mp_dup_456']);

        $this->mock(PaymentService::class, function ($mock) {
            $mock->shouldReceive('validateWebhookSignature')->andReturn(true);
            // handleWebhook deve ser chamado mas não fazer nada (idempotência interna do PaymentService)
            $mock->shouldReceive('handleWebhook')->once();
        });

        $response = $this->postJson(
            '/api/webhooks/mercadopago?topic=payment&data_id=mp_dup_456',
            ['type' => 'payment', 'data' => ['id' => 'mp_dup_456']]
        );

        $response->assertStatus(200);
    }
}
```

- [ ] **Step 2: Rodar os testes**

```bash
cd backend
php artisan test tests/Feature/WebhookTest.php
```

Expected: todos PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/WebhookTest.php
git commit -m "test: add webhook feature tests"
```

---

## Task 8: Mail Classes + Templates Blade

**Files:**
- Create: `backend/app/Mail/OrderConfirmed.php`
- Create: `backend/app/Mail/BoletoGenerated.php`
- Create: `backend/app/Mail/AdminNewSale.php`
- Create: `backend/app/Mail/ExperienceReady.php`
- Create: `backend/resources/views/mail/order-confirmed.blade.php`
- Create: `backend/resources/views/mail/boleto-generated.blade.php`
- Create: `backend/resources/views/mail/admin-new-sale.blade.php`
- Create: `backend/resources/views/mail/experience-ready.blade.php`

- [ ] **Step 1: Gerar as classes de Mail**

```bash
cd backend
php artisan make:mail OrderConfirmed
php artisan make:mail BoletoGenerated
php artisan make:mail AdminNewSale
php artisan make:mail ExperienceReady
```

- [ ] **Step 2: Implementar OrderConfirmed**

```php
<?php
// backend/app/Mail/OrderConfirmed.php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Compra confirmada — Zefirus BeArt');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.order-confirmed');
    }
}
```

- [ ] **Step 3: Implementar BoletoGenerated**

```php
<?php
// backend/app/Mail/BoletoGenerated.php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BoletoGenerated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Seu boleto está pronto — Zefirus BeArt');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.boleto-generated');
    }
}
```

- [ ] **Step 4: Implementar AdminNewSale**

```php
<?php
// backend/app/Mail/AdminNewSale.php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminNewSale extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Nova venda — ' . $this->order->artwork->title);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.admin-new-sale');
    }
}
```

- [ ] **Step 5: Implementar ExperienceReady**

```php
<?php
// backend/app/Mail/ExperienceReady.php

namespace App\Mail;

use App\Models\AcquiredExperience;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExperienceReady extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public AcquiredExperience $experience
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Sua obra chegou — Acesse sua Experiência exclusiva');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.experience-ready');
    }
}
```

- [ ] **Step 6: Criar pasta de views de mail**

```bash
cd backend
mkdir -p resources/views/mail
```

- [ ] **Step 7: Criar template order-confirmed.blade.php**

```blade
{{-- backend/resources/views/mail/order-confirmed.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Compra Confirmada</title></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; border-bottom: 1px solid #c9a96e; padding-bottom: 1rem;">Zefirus BeArt</h1>
    <p>Olá, <strong>{{ $order->buyer_name }}</strong>.</p>
    <p>Sua compra foi confirmada com sucesso.</p>
    <table style="width:100%; border-collapse: collapse; margin: 1.5rem 0;">
        <tr><td style="padding: 0.5rem; color: #666;">Obra</td><td>{{ $order->artwork->title }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Valor</td><td>R$ {{ number_format($order->amount, 2, ',', '.') }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Frete</td><td>R$ {{ number_format($order->shipping_cost, 2, ',', '.') }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Nº do Pedido</td><td>#{{ $order->id }}</td></tr>
    </table>
    <p>Prepararemos sua obra com todo o cuidado. Você receberá um e-mail quando ela for enviada.</p>
    <p style="margin-top: 2rem; color: #999; font-size: 0.85rem;">— Beatriz Gioielli · Zefirus BeArt</p>
</body>
</html>
```

- [ ] **Step 8: Criar template boleto-generated.blade.php**

```blade
{{-- backend/resources/views/mail/boleto-generated.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Boleto Gerado</title></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; border-bottom: 1px solid #c9a96e; padding-bottom: 1rem;">Zefirus BeArt</h1>
    <p>Olá, <strong>{{ $order->buyer_name }}</strong>.</p>
    <p>Seu boleto para a obra <strong>{{ $order->artwork->title }}</strong> foi gerado.</p>
    <p><strong>Valor total:</strong> R$ {{ number_format($order->amount + $order->shipping_cost, 2, ',', '.') }}</p>
    @if($order->boleto_barcode)
    <p style="background: #f5f5f5; padding: 1rem; font-family: monospace; word-break: break-all;">
        {{ $order->boleto_barcode }}
    </p>
    @endif
    @if($order->boleto_url)
    <p><a href="{{ $order->boleto_url }}" style="background: #2c2c2c; color: #fff; padding: 0.75rem 1.5rem; text-decoration: none; display: inline-block;">Visualizar Boleto</a></p>
    @endif
    <p style="color: #666; font-size: 0.9rem;">O boleto vence em 3 dias úteis. Após o pagamento, a confirmação pode levar até 3 dias úteis.</p>
    <p style="margin-top: 2rem; color: #999; font-size: 0.85rem;">— Beatriz Gioielli · Zefirus BeArt</p>
</body>
</html>
```

- [ ] **Step 9: Criar template admin-new-sale.blade.php**

```blade
{{-- backend/resources/views/mail/admin-new-sale.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Nova Venda</title></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; border-bottom: 1px solid #c9a96e; padding-bottom: 1rem;">Nova Venda — Zefirus BeArt</h1>
    <table style="width:100%; border-collapse: collapse; margin: 1.5rem 0;">
        <tr><td style="padding: 0.5rem; color: #666;">Obra</td><td>{{ $order->artwork->title }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Comprador</td><td>{{ $order->buyer_name }} ({{ $order->buyer_email }})</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Telefone</td><td>{{ $order->buyer_phone }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Valor</td><td>R$ {{ number_format($order->amount, 2, ',', '.') }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Frete</td><td>R$ {{ number_format($order->shipping_cost ?? 0, 2, ',', '.') }} ({{ $order->shipping_option }})</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Método</td><td>{{ strtoupper($order->mp_payment_method) }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Pedido #</td><td>{{ $order->id }}</td></tr>
        @if($order->buyer_message)
        <tr><td style="padding: 0.5rem; color: #666;">Mensagem</td><td><em>{{ $order->buyer_message }}</em></td></tr>
        @endif
    </table>
    <p style="color: #666;">Endereço de entrega: {{ $order->shipping_address['street'] }}, {{ $order->shipping_address['number'] }} — {{ $order->shipping_address['city'] }}/{{ $order->shipping_address['state'] }}, CEP {{ $order->shipping_address['zip_code'] }}</p>
</body>
</html>
```

- [ ] **Step 10: Criar template experience-ready.blade.php**

```blade
{{-- backend/resources/views/mail/experience-ready.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Sua obra chegou</title></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; border-bottom: 1px solid #c9a96e; padding-bottom: 1rem;">Zefirus BeArt</h1>
    <p>Olá, <strong>{{ $order->buyer_name }}</strong>.</p>
    <p>Sua obra <strong>{{ $order->artwork->title }}</strong> chegou ao seu destino.</p>
    <p>Preparamos uma experiência exclusiva para você — um espaço imersivo com a história, as intenções e a alma desta obra.</p>
    <p style="text-align: center; margin: 2rem 0;">
        <a href="{{ config('app.url') }}/experience/{{ $experience->unique_hash }}"
           style="background: #2c2c2c; color: #fff; padding: 1rem 2rem; text-decoration: none; display: inline-block; font-size: 1rem;">
            Acessar Minha Experiência
        </a>
    </p>
    <p style="color: #666; font-size: 0.9rem;">Guarde este link — ele é único e exclusivo para você.</p>
    <p style="margin-top: 2rem; color: #999; font-size: 0.85rem;">— Beatriz Gioielli · Zefirus BeArt</p>
</body>
</html>
```

- [ ] **Step 11: Commit**

```bash
git add app/Mail/ resources/views/mail/
git commit -m "feat: add mail classes and blade templates for order lifecycle"
```

---

## Task 9: Atualizar api.php + AdminArtworkController

**Files:**
- Modify: `backend/routes/api.php`
- Modify: `backend/app/Http/Controllers/Api/AdminArtworkController.php`

- [ ] **Step 1: Substituir routes/api.php**

```php
<?php
// backend/routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ArtworkController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\AvatarController;
use App\Http\Controllers\Api\ExperienceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\AdminArtworkController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\OrderController;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Públicas
Route::get('/artworks', [ArtworkController::class, 'index']);
Route::get('/artworks/{id}', [ArtworkController::class, 'show']);
Route::get('/review-avatars', [AvatarController::class, 'index']);
Route::post('/artworks/{id}/reviews', [ReviewController::class, 'store']);
Route::get('/experience/{unique_hash}', [ExperienceController::class, 'show']);
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{slug}', [EventController::class, 'show']);

// Checkout e envio
Route::get('/checkout/shipping', [ShippingController::class, 'options']);
Route::post('/checkout', [PaymentController::class, 'checkout']);
Route::get('/orders/{id}/status', [OrderController::class, 'status']);
Route::post('/webhooks/mercadopago', [PaymentController::class, 'webhook']);

// Admin
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Obras
    Route::delete('/admin/artworks/{id}/media/{mediaId}', [AdminArtworkController::class, 'destroyMedia']);
    Route::apiResource('/admin/artworks', AdminArtworkController::class);

    // Coleções
    Route::apiResource('/admin/collections', \App\Http\Controllers\Api\AdminCollectionController::class);

    // Pedidos
    Route::get('/admin/orders', [OrderController::class, 'index']);
    Route::get('/admin/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/admin/orders/{id}/shipping', [OrderController::class, 'updateShipping']);
    Route::put('/admin/orders/{id}/experience', [OrderController::class, 'updateExperience']);
});
```

- [ ] **Step 2: Adicionar campos shipping_* na validação do AdminArtworkController**

No arquivo `backend/app/Http/Controllers/Api/AdminArtworkController.php`, adicione estes campos ao array `$request->validate()` dos métodos `store()` e `update()`:

```php
'shipping_weight' => 'nullable|numeric|min:0',
'shipping_height' => 'nullable|integer|min:0',
'shipping_width'  => 'nullable|integer|min:0',
'shipping_length' => 'nullable|integer|min:0',
```

- [ ] **Step 3: Verificar rotas**

```bash
cd backend
php artisan route:list --path=api/checkout
php artisan route:list --path=api/admin/orders
```

Expected: rotas listadas corretamente.

- [ ] **Step 4: Rodar todos os testes**

```bash
cd backend
php artisan test
```

Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add routes/api.php app/Http/Controllers/Api/AdminArtworkController.php
git commit -m "feat: wire all checkout and order admin routes"
```

---

## Task 10: Frontend — .env + api.ts + App.tsx

**Files:**
- Create: `frontend/.env`
- Create: `frontend/.env.example`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Criar frontend/.env**

```env
VITE_MP_PUBLIC_KEY=TEST-994fa8f0-d6fd-4937-83be-b962b65ab12f
VITE_API_URL=http://localhost:8000/api
```

- [ ] **Step 2: Criar frontend/.env.example**

```env
VITE_MP_PUBLIC_KEY=
VITE_API_URL=http://localhost:8000/api
```

- [ ] **Step 3: Atualizar frontend/src/lib/api.ts**

```typescript
// frontend/src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

- [ ] **Step 4: Adicionar imports e rotas ao App.tsx**

No `frontend/src/App.tsx`, adicionar os imports das novas páginas:

```typescript
import OrderPending from './pages/OrderPending';
import OrderSuccess from './pages/OrderSuccess';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
```

E dentro do `<Routes>`, adicionar dentro de `<Route path="/" element={<Layout />}>`:

```tsx
<Route path="pedido/:orderId" element={<OrderPending />} />
<Route path="pedido/:orderId/confirmado" element={<OrderSuccess />} />
```

E dentro do bloco `/admin`:

```tsx
<Route path="orders" element={<AdminOrders />} />
<Route path="orders/:id" element={<AdminOrderDetail />} />
```

- [ ] **Step 5: Commit**

```bash
cd frontend
git add .env.example src/lib/api.ts src/App.tsx
git commit -m "feat: configure frontend env, api.ts and routing"
```

---

## Task 11: Frontend — Checkout.tsx (Reescrita Completa)

**Files:**
- Modify: `frontend/src/pages/Checkout.tsx` (reescrita)

- [ ] **Step 1: Substituir Checkout.tsx completamente**

```tsx
// frontend/src/pages/Checkout.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { api } from '../lib/api';

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'pt-BR' });

interface Address {
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
  estimated_days: string;
}

interface ArtworkData {
  id: number;
  title: string;
  price: number;
}

const emptyAddress = (): Address => ({
  zip_code: '', street: '', number: '', complement: '',
  neighborhood: '', city: '', state: '',
});

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [artwork, setArtwork] = useState<ArtworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Step 1: Dados pessoais
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCpf, setBuyerCpf] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerMessage, setBuyerMessage] = useState('');
  const [billingAddress, setBillingAddress] = useState<Address>(emptyAddress());

  // Step 2: Endereço e frete
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<Address>(emptyAddress());
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  useEffect(() => {
    api.get(`/artworks/${id}`).then(r => {
      setArtwork(r.data);
      setLoading(false);
    }).catch(() => {
      setError('Obra não encontrada.');
      setLoading(false);
    });
  }, [id]);

  const fetchShipping = async (zipCode: string) => {
    if (zipCode.replace(/\D/g, '').length !== 8) return;
    setLoadingShipping(true);
    try {
      const r = await api.get('/checkout/shipping', {
        params: { artwork_id: id, zip_code: zipCode.replace(/\D/g, '') }
      });
      setShippingOptions(r.data);
    } catch {
      setShippingOptions([]);
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleStep2Next = () => {
    const addr = sameAsBilling ? billingAddress : shippingAddress;
    if (addr.zip_code.replace(/\D/g, '').length === 8) {
      fetchShipping(addr.zip_code);
    }
    setStep(3);
  };

  const totalAmount = (artwork?.price ?? 0) + (selectedShipping?.cost ?? 0);

  const onPaymentSubmit = async ({ selectedPaymentMethod, formData }: any) => {
    const finalShippingAddress = sameAsBilling ? billingAddress : shippingAddress;

    const payload = {
      artwork_id:       Number(id),
      payment_method:   selectedPaymentMethod,
      buyer_name:       buyerName,
      buyer_email:      buyerEmail,
      buyer_cpf:        buyerCpf,
      buyer_phone:      buyerPhone,
      buyer_message:    buyerMessage || undefined,
      billing_address:  billingAddress,
      shipping_address: finalShippingAddress,
      shipping_option:  selectedShipping?.name ?? '',
      shipping_cost:    selectedShipping?.cost ?? 0,
      // Dados do cartão vindos do Bricks
      card_token:         formData?.token,
      payment_method_id:  formData?.payment_method_id,
      installments:       formData?.installments,
    };

    try {
      const r = await api.post('/checkout', payload);
      const { order_id, status } = r.data;

      if (status === 'approved') {
        navigate(`/pedido/${order_id}/confirmado`);
      } else {
        navigate(`/pedido/${order_id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao processar pagamento.';
      throw new Error(msg);
    }
  };

  if (loading) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Carregando...</div>;
  if (error || !artwork) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>{error}</div>;

  const inputStyle = {
    width: '100%', padding: '0.75rem', border: '1px solid #ddd',
    borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box' as const,
    marginBottom: '1rem', fontFamily: 'var(--font-sans, sans-serif)',
  };

  const labelStyle = { display: 'block', marginBottom: '0.25rem', color: '#666', fontSize: '0.875rem' };

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
        Garantindo a Obra
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>{artwork.title}</p>

      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['Dados pessoais', 'Endereço e frete', 'Pagamento'].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem',
            background: step === i + 1 ? '#2c2c2c' : step > i + 1 ? '#c9a96e' : '#f5f5f5',
            color: step >= i + 1 ? '#fff' : '#999', borderRadius: '4px',
          }}>{label}</div>
        ))}
      </div>

      {/* Step 1: Dados pessoais */}
      {step === 1 && (
        <div>
          <label style={labelStyle}>Nome completo *</label>
          <input style={inputStyle} value={buyerName} onChange={e => setBuyerName(e.target.value)} />
          <label style={labelStyle}>E-mail *</label>
          <input style={inputStyle} type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>CPF *</label>
              <input style={inputStyle} placeholder="000.000.000-00" value={buyerCpf} onChange={e => setBuyerCpf(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Telefone *</label>
              <input style={inputStyle} placeholder="(11) 99999-9999" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} />
            </div>
          </div>
          <label style={labelStyle}>CEP *</label>
          <input style={inputStyle} placeholder="00000-000" value={billingAddress.zip_code} onChange={e => setBillingAddress(a => ({...a, zip_code: e.target.value}))} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Rua *</label>
              <input style={inputStyle} value={billingAddress.street} onChange={e => setBillingAddress(a => ({...a, street: e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Número *</label>
              <input style={inputStyle} value={billingAddress.number} onChange={e => setBillingAddress(a => ({...a, number: e.target.value}))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Bairro *</label>
              <input style={inputStyle} value={billingAddress.neighborhood} onChange={e => setBillingAddress(a => ({...a, neighborhood: e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Cidade *</label>
              <input style={inputStyle} value={billingAddress.city} onChange={e => setBillingAddress(a => ({...a, city: e.target.value}))} />
            </div>
          </div>
          <label style={labelStyle}>UF *</label>
          <input style={{...inputStyle, maxWidth: '80px'}} maxLength={2} value={billingAddress.state} onChange={e => setBillingAddress(a => ({...a, state: e.target.value.toUpperCase()}))} />
          <label style={labelStyle}>Mensagem para a artista (opcional)</label>
          <textarea style={{...inputStyle, height: '100px', resize: 'vertical'}} value={buyerMessage} onChange={e => setBuyerMessage(e.target.value)} />
          <button
            className="btn-primary"
            onClick={() => setStep(2)}
            disabled={!buyerName || !buyerEmail || !buyerCpf || !billingAddress.zip_code}
          >
            Continuar →
          </button>
        </div>
      )}

      {/* Step 2: Endereço de entrega e frete */}
      {step === 2 && (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={sameAsBilling} onChange={e => setSameAsBinding(e.target.checked)} />
            Endereço de entrega igual ao de cobrança
          </label>
          {!sameAsBilling && (
            <>
              <label style={labelStyle}>CEP de entrega *</label>
              <input style={inputStyle} placeholder="00000-000" value={shippingAddress.zip_code} onChange={e => setShippingAddress(a => ({...a, zip_code: e.target.value}))} />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div><label style={labelStyle}>Rua *</label><input style={inputStyle} value={shippingAddress.street} onChange={e => setShippingAddress(a => ({...a, street: e.target.value}))} /></div>
                <div><label style={labelStyle}>Número *</label><input style={inputStyle} value={shippingAddress.number} onChange={e => setShippingAddress(a => ({...a, number: e.target.value}))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={labelStyle}>Bairro *</label><input style={inputStyle} value={shippingAddress.neighborhood} onChange={e => setShippingAddress(a => ({...a, neighborhood: e.target.value}))} /></div>
                <div><label style={labelStyle}>Cidade *</label><input style={inputStyle} value={shippingAddress.city} onChange={e => setShippingAddress(a => ({...a, city: e.target.value}))} /></div>
              </div>
              <label style={labelStyle}>UF *</label>
              <input style={{...inputStyle, maxWidth: '80px'}} maxLength={2} value={shippingAddress.state} onChange={e => setShippingAddress(a => ({...a, state: e.target.value.toUpperCase()}))} />
            </>
          )}
          <button
            className="btn-primary"
            style={{ marginBottom: '1rem' }}
            onClick={() => {
              const zip = sameAsBilling ? billingAddress.zip_code : shippingAddress.zip_code;
              fetchShipping(zip);
            }}
            disabled={loadingShipping}
          >
            {loadingShipping ? 'Calculando...' : 'Calcular Frete'}
          </button>

          {shippingOptions.length > 0 && (
            <div>
              <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Selecione o frete:</label>
              {shippingOptions.map(opt => (
                <label key={opt.id} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem',
                  border: `1px solid ${selectedShipping?.id === opt.id ? '#2c2c2c' : '#ddd'}`,
                  borderRadius: '4px', marginBottom: '0.5rem', cursor: 'pointer',
                  background: selectedShipping?.id === opt.id ? '#f9f5ef' : '#fff',
                }}>
                  <input type="radio" name="shipping" style={{ marginRight: '0.75rem' }}
                    checked={selectedShipping?.id === opt.id}
                    onChange={() => setSelectedShipping(opt)} />
                  <span style={{ flex: 1 }}>{opt.name} — {opt.estimated_days}</span>
                  <strong>R$ {opt.cost.toFixed(2).replace('.', ',')}</strong>
                </label>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(1)} style={{ padding: '0.75rem 1.5rem', background: 'none', border: '1px solid #ddd', cursor: 'pointer', borderRadius: '4px' }}>← Voltar</button>
            <button className="btn-primary" onClick={handleStep2Next} disabled={!selectedShipping}>Continuar →</button>
          </div>
        </div>
      )}

      {/* Step 3: Pagamento com MP Bricks */}
      {step === 3 && (
        <div>
          <div style={{ background: '#f9f5ef', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>{artwork.title}</span>
              <span>R$ {artwork.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              <span>Frete ({selectedShipping?.name})</span>
              <span>R$ {(selectedShipping?.cost ?? 0).toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total</span>
              <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <Payment
            initialization={{
              amount: totalAmount,
              payer: {
                firstName: buyerName.split(' ')[0],
                lastName: buyerName.split(' ').slice(1).join(' '),
                email: buyerEmail,
              },
            }}
            customization={{
              paymentMethods: {
                creditCard: 'all',
                ticket: 'all',
                bankTransfer: 'all',
              },
            }}
            onSubmit={onPaymentSubmit}
            onError={(err) => console.error('MP Bricks error:', err)}
          />

          <button onClick={() => setStep(2)} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'none', border: '1px solid #ddd', cursor: 'pointer', borderRadius: '4px' }}>← Voltar</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Iniciar o dev server e testar manualmente**

```bash
cd frontend
npm run dev
```

Acessar `http://localhost:5173/checkout/1` e verificar:
- Step 1 renderiza sem erros
- Step 2 aparece ao clicar "Continuar"
- Step 3 carrega o MP Bricks (pode demorar alguns segundos)

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/Checkout.tsx .env.example
git commit -m "feat: rewrite Checkout page with multi-step form and MP Bricks"
```

---

## Task 12: Frontend — OrderPending.tsx + OrderSuccess.tsx

**Files:**
- Create: `frontend/src/pages/OrderPending.tsx`
- Create: `frontend/src/pages/OrderSuccess.tsx`

- [ ] **Step 1: Criar OrderPending.tsx**

```tsx
// frontend/src/pages/OrderPending.tsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface OrderStatus {
  order_id: number;
  status: string;
  payment_method: string;
  pix_qr_code?: string;
  pix_qr_code_text?: string;
  boleto_url?: string;
  boleto_barcode?: string;
}

export default function OrderPending() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const r = await api.get(`/orders/${orderId}/status`);
      setOrder(r.data);
      if (r.data.status === 'approved') {
        clearInterval(intervalRef.current!);
        navigate(`/pedido/${orderId}/confirmado`);
      }
      if (['rejected', 'cancelled'].includes(r.data.status)) {
        clearInterval(intervalRef.current!);
      }
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchStatus();
    // Polling a cada 5s apenas para PIX (boleto pode demorar dias)
    intervalRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(intervalRef.current!);
  }, [orderId]);

  const copyPix = () => {
    if (!order?.pix_qr_code_text) return;
    navigator.clipboard.writeText(order.pix_qr_code_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '560px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
        {order.payment_method === 'boleto' ? 'Seu Boleto' : 'Aguardando Pagamento'}
      </h1>

      {order.payment_method === 'pix' && (
        <div className="glass" style={{ padding: '2rem', borderRadius: '8px' }}>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Escaneie o QR code ou copie o código Pix para pagar.
          </p>
          {order.pix_qr_code && (
            <img
              src={`data:image/png;base64,${order.pix_qr_code}`}
              alt="QR Code Pix"
              style={{ width: '200px', height: '200px', margin: '0 auto 1.5rem' }}
            />
          )}
          {order.pix_qr_code_text && (
            <>
              <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', background: '#f5f5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                {order.pix_qr_code_text}
              </p>
              <button className="btn-primary" onClick={copyPix}>
                {copied ? '✓ Copiado!' : 'Copiar código Pix'}
              </button>
            </>
          )}
          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#999' }}>
            Esta página atualiza automaticamente após o pagamento.
          </p>
        </div>
      )}

      {order.payment_method === 'boleto' && (
        <div className="glass" style={{ padding: '2rem', borderRadius: '8px' }}>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            O boleto foi enviado para o seu e-mail. Você também pode acessá-lo pelo link abaixo.
          </p>
          {order.boleto_barcode && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', background: '#f5f5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              {order.boleto_barcode}
            </p>
          )}
          {order.boleto_url && (
            <a href={order.boleto_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-block' }}>
              Abrir Boleto
            </a>
          )}
          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#999' }}>
            A confirmação pode levar até 3 dias úteis após o pagamento.
          </p>
        </div>
      )}

      {['rejected', 'cancelled'].includes(order.status) && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
          <p style={{ color: '#dc2626' }}>Pagamento não aprovado. Por favor, tente novamente.</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Criar OrderSuccess.tsx**

```tsx
// frontend/src/pages/OrderSuccess.tsx
import { useParams, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '560px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✦</div>
      <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
        Compra Confirmada
      </h1>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '8px' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '1.5rem', color: '#444' }}>
          Obrigada por adquirir esta obra exclusiva.
          Você receberá um e-mail de confirmação em breve.
        </p>
        <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '2rem' }}>
          Pedido <strong>#{orderId}</strong>
          <br />
          Sua obra será preparada com todo o cuidado e enviada em breve.
          Quando ela chegar, você receberá um e-mail especial com acesso à sua Experiência exclusiva.
        </p>
        <Link to="/catalog" className="btn-primary">
          Explorar mais obras
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/OrderPending.tsx src/pages/OrderSuccess.tsx
git commit -m "feat: add OrderPending and OrderSuccess pages"
```

---

## Task 13: Frontend Admin — AdminArtworkEdit.tsx (Campos de Embalagem)

**Files:**
- Modify: `frontend/src/pages/admin/AdminArtworkEdit.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Abrir `frontend/src/pages/admin/AdminArtworkEdit.tsx` e localizar a seção do formulário onde estão os campos `meli_*`.

- [ ] **Step 2: Adicionar campos de embalagem ao estado e ao formulário**

Adicionar ao estado do formulário (próximo dos campos `meli_*`):

```typescript
shipping_weight: '',
shipping_height: '',
shipping_width: '',
shipping_length: '',
```

Adicionar ao formulário, após os campos `meli_*`:

```tsx
<div style={{ marginTop: '2rem' }}>
  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#666' }}>Dados de embalagem (para cálculo de frete)</h3>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
    <div>
      <label>Peso (kg)</label>
      <input
        type="number" step="0.1" min="0"
        value={form.shipping_weight}
        onChange={e => setForm({ ...form, shipping_weight: e.target.value })}
      />
    </div>
    <div>
      <label>Altura embalagem (cm)</label>
      <input
        type="number" min="0"
        value={form.shipping_height}
        onChange={e => setForm({ ...form, shipping_height: e.target.value })}
      />
    </div>
    <div>
      <label>Largura embalagem (cm)</label>
      <input
        type="number" min="0"
        value={form.shipping_width}
        onChange={e => setForm({ ...form, shipping_width: e.target.value })}
      />
    </div>
    <div>
      <label>Comprimento embalagem (cm)</label>
      <input
        type="number" min="0"
        value={form.shipping_length}
        onChange={e => setForm({ ...form, shipping_length: e.target.value })}
      />
    </div>
  </div>
</div>
```

Garantir que esses campos também sejam incluídos no `FormData` enviado ao backend (junto com os outros campos).

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/admin/AdminArtworkEdit.tsx
git commit -m "feat: add shipping dimension fields to AdminArtworkEdit"
```

---

## Task 14: Frontend Admin — AdminOrders.tsx + AdminOrderDetail.tsx

**Files:**
- Create: `frontend/src/pages/admin/AdminOrders.tsx`
- Create: `frontend/src/pages/admin/AdminOrderDetail.tsx`

- [ ] **Step 1: Criar AdminOrders.tsx**

```tsx
// frontend/src/pages/admin/AdminOrders.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface Order {
  id: number;
  status: string;
  mp_payment_method: string;
  amount: number;
  shipping_cost: number;
  buyer_name: string;
  buyer_email: string;
  shipping_status: string | null;
  shipping_tracking_code: string | null;
  experience_published_at: string | null;
  artwork: { id: number; title: string };
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#6b7280',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders').then(r => {
      setOrders(r.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Pedidos</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>#</th>
              <th style={{ padding: '0.75rem' }}>Obra</th>
              <th style={{ padding: '0.75rem' }}>Comprador</th>
              <th style={{ padding: '0.75rem' }}>Valor</th>
              <th style={{ padding: '0.75rem' }}>Pagamento</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Envio</th>
              <th style={{ padding: '0.75rem' }}>Experiência</th>
              <th style={{ padding: '0.75rem' }}>Data</th>
              <th style={{ padding: '0.75rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>#{order.id}</td>
                <td style={{ padding: '0.75rem' }}>{order.artwork?.title}</td>
                <td style={{ padding: '0.75rem' }}>
                  <div>{order.buyer_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{order.buyer_email}</div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  R$ {(order.amount + (order.shipping_cost ?? 0)).toFixed(2).replace('.', ',')}
                </td>
                <td style={{ padding: '0.75rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                  {order.mp_payment_method}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    background: STATUS_COLORS[order.status] + '20',
                    color: STATUS_COLORS[order.status],
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                  }}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  {order.shipping_status ?? '—'}
                  {order.shipping_tracking_code && <div style={{ fontSize: '0.75rem' }}>{order.shipping_tracking_code}</div>}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {order.experience_published_at
                    ? <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Publicada</span>
                    : order.status === 'approved'
                      ? <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>Pendente</span>
                      : '—'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6b7280' }}>
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <Link to={`/admin/orders/${order.id}`} style={{ color: '#2c2c2c', textDecoration: 'underline', fontSize: '0.85rem' }}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar AdminOrderDetail.tsx**

```tsx
// frontend/src/pages/admin/AdminOrderDetail.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

interface Experience {
  id: number;
  dedication: string | null;
  creation_video_url: string | null;
  exhibition_history: string | null;
  unique_hash: string;
}

interface OrderDetail {
  id: number;
  status: string;
  mp_payment_method: string;
  mp_payment_id: string;
  amount: number;
  shipping_cost: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_cpf: string;
  buyer_message: string | null;
  shipping_status: string | null;
  shipping_option: string | null;
  shipping_tracking_code: string | null;
  experience_published_at: string | null;
  shipping_address: Record<string, string>;
  acquired_experience: Experience | null;
  artwork: { id: number; title: string; price: number };
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState('');

  // Shipping form
  const [trackingCode, setTrackingCode] = useState('');
  const [shippingStatus, setShippingStatus] = useState('');

  // Experience form
  const [dedication, setDedication] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [exhibition, setExhibition] = useState('');

  useEffect(() => {
    api.get(`/admin/orders/${id}`).then(r => {
      const o = r.data;
      setOrder(o);
      setTrackingCode(o.shipping_tracking_code ?? '');
      setShippingStatus(o.shipping_status ?? 'pending');
      setDedication(o.acquired_experience?.dedication ?? '');
      setVideoUrl(o.acquired_experience?.creation_video_url ?? '');
      setExhibition(o.acquired_experience?.exhibition_history ?? '');
    });
  }, [id]);

  const saveShipping = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${id}/shipping`, {
        shipping_tracking_code: trackingCode || null,
        shipping_status: shippingStatus,
      });
      setMsg('Envio atualizado.');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const saveExperience = async (publish = false) => {
    setPublishing(publish);
    setSaving(true);
    try {
      const r = await api.put(`/admin/orders/${id}/experience`, {
        dedication,
        creation_video_url: videoUrl || null,
        exhibition_history: exhibition || null,
        publish,
      });
      setOrder(r.data);
      setMsg(publish ? 'Experiência publicada! E-mail enviado ao comprador.' : 'Experiência salva.');
    } finally {
      setSaving(false);
      setPublishing(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  if (!order) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #ddd',
    borderRadius: '4px', fontSize: '0.9rem', marginBottom: '0.75rem',
    boxSizing: 'border-box' as const,
  };

  const total = order.amount + (order.shipping_cost ?? 0);
  const experienceReady = dedication.trim().length > 0;
  const alreadyPublished = !!order.experience_published_at;
  const needsAttention = order.status === 'approved' && order.shipping_status === 'delivered' && !alreadyPublished;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pedido #{order.id}</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{order.artwork.title}</p>

      {needsAttention && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          ⚠️ A obra foi entregue mas a Experiência ainda não foi publicada. Preencha o conteúdo abaixo e clique em "Publicar".
        </div>
      )}

      {msg && (
        <div style={{ background: '#d1fae5', border: '1px solid #10b981', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#065f46' }}>
          {msg}
        </div>
      )}

      {/* Dados do pedido */}
      <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>Dados do Pedido</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div><span style={{ color: '#6b7280' }}>Status:</span> <strong>{order.status}</strong></div>
          <div><span style={{ color: '#6b7280' }}>Método:</span> <strong>{order.mp_payment_method.toUpperCase()}</strong></div>
          <div><span style={{ color: '#6b7280' }}>Valor:</span> R$ {order.amount.toFixed(2).replace('.', ',')}</div>
          <div><span style={{ color: '#6b7280' }}>Frete:</span> R$ {(order.shipping_cost ?? 0).toFixed(2).replace('.', ',')} ({order.shipping_option})</div>
          <div><span style={{ color: '#6b7280' }}>Total:</span> <strong>R$ {total.toFixed(2).replace('.', ',')}</strong></div>
          <div><span style={{ color: '#6b7280' }}>MP ID:</span> {order.mp_payment_id}</div>
        </div>
      </section>

      {/* Dados do comprador */}
      <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>Comprador</h2>
        <div style={{ fontSize: '0.875rem' }}>
          <p><strong>{order.buyer_name}</strong></p>
          <p style={{ color: '#6b7280' }}>{order.buyer_email} · {order.buyer_phone} · CPF: {order.buyer_cpf}</p>
          {order.buyer_message && <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>"{order.buyer_message}"</p>}
          <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>
            Entrega: {order.shipping_address.street}, {order.shipping_address.number} —{' '}
            {order.shipping_address.city}/{order.shipping_address.state}, CEP {order.shipping_address.zip_code}
          </p>
        </div>
      </section>

      {/* Envio */}
      {order.status === 'approved' && (
        <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>Controle de Envio</h2>
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Código de rastreio</label>
          <input style={inputStyle} value={trackingCode} onChange={e => setTrackingCode(e.target.value)} placeholder="BR123456789BR" />
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Status do envio</label>
          <select style={inputStyle} value={shippingStatus} onChange={e => setShippingStatus(e.target.value)}>
            <option value="pending">Aguardando envio</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregue</option>
          </select>
          <button
            onClick={saveShipping}
            disabled={saving}
            style={{ padding: '0.6rem 1.25rem', background: '#2c2c2c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {saving ? 'Salvando...' : 'Salvar envio'}
          </button>
        </section>
      )}

      {/* AcquiredExperience */}
      {order.acquired_experience && (
        <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#374151' }}>Experiência Exclusiva</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
            Hash: <code>{order.acquired_experience.unique_hash}</code>
            {alreadyPublished && <span style={{ marginLeft: '0.75rem', color: '#10b981' }}>✓ Publicada</span>}
          </p>
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Dedicatória *</label>
          <textarea style={{ ...inputStyle, height: '120px', resize: 'vertical' }} value={dedication} onChange={e => setDedication(e.target.value)} placeholder="Texto personalizado da artista para o comprador..." />
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>URL do vídeo de criação</label>
          <input style={inputStyle} value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." />
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Histórico de exposições</label>
          <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }} value={exhibition} onChange={e => setExhibition(e.target.value)} />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => saveExperience(false)}
              disabled={saving}
              style={{ padding: '0.6rem 1.25rem', background: '#fff', color: '#2c2c2c', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
            >
              Salvar rascunho
            </button>
            {!alreadyPublished && (
              <button
                onClick={() => saveExperience(true)}
                disabled={saving || !experienceReady}
                style={{ padding: '0.6rem 1.25rem', background: experienceReady ? '#c9a96e' : '#e5e7eb', color: experienceReady ? '#fff' : '#9ca3af', border: 'none', borderRadius: '4px', cursor: experienceReady ? 'pointer' : 'not-allowed' }}
              >
                {publishing ? 'Publicando...' : 'Publicar e enviar e-mail'}
              </button>
            )}
          </div>
          {!experienceReady && (
            <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem' }}>Preencha a dedicatória para publicar.</p>
          )}
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Adicionar link "Pedidos" na navegação do admin**

No arquivo `frontend/src/components/AdminLayout.tsx`, adicionar link de navegação para `/admin/orders` próximo aos links existentes de artworks e collections.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/pages/admin/AdminOrders.tsx src/pages/admin/AdminOrderDetail.tsx src/components/AdminLayout.tsx
git commit -m "feat: add AdminOrders and AdminOrderDetail pages"
```

---

## Task 15: Verificação Final + Testes de Integração

- [ ] **Step 1: Rodar todos os testes do backend**

```bash
cd backend
php artisan test
```

Expected: todos PASS.

- [ ] **Step 2: Verificar queue worker**

Em terminal separado:
```bash
cd backend
php artisan queue:work --once
```

Expected: processa jobs pendentes sem erro.

- [ ] **Step 3: Testar fluxo PIX manualmente**

1. Iniciar backend: `php artisan serve`
2. Iniciar frontend: `npm run dev` (na pasta frontend)
3. Acessar uma obra no catálogo → clicar em comprar → `http://localhost:5173/checkout/{id}`
4. Preencher Step 1 com dados reais de teste
5. Calcular frete com um CEP real (ex: `01310100`)
6. No Step 3, selecionar PIX e submeter
7. Verificar redirecionamento para `/pedido/{id}` com QR code

- [ ] **Step 4: Testar rejeição de obra vendida**

```bash
cd backend
php artisan tinker --execute="App\Models\Artwork::first()->update(['is_sold' => true]);"
```

Tentar comprar a obra → verificar que recebe resposta 409.

- [ ] **Step 5: Verificar admin panel de pedidos**

1. Fazer login no admin
2. Acessar `/admin/orders` → ver lista de pedidos
3. Clicar em um pedido aprovado → preencher dedicatória → clicar "Salvar rascunho"
4. Verificar que botão "Publicar" fica ativo

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "feat: complete Mercado Pago transparent checkout integration"
```

---

## Notas de Implementação

**Webhook em desenvolvimento:** Use [ngrok](https://ngrok.com/) para expor o backend:
```bash
ngrok http 8000
```
Configure a URL `https://SEU_HASH.ngrok.io/api/webhooks/mercadopago` no painel de desenvolvedor do Mercado Pago em **"Suas integrações" → "Webhooks"**. Marque os tópicos `payment` e `shipments`.

**Credenciais de teste:** Os cartões de teste para sandbox estão em [https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards).

**Passagem para produção:** Substituir `MP_ACCESS_TOKEN` e `MP_PUBLIC_KEY` pelas credenciais live (sem prefixo `TEST-`). Atualizar URL do webhook no painel MP para o domínio real.
