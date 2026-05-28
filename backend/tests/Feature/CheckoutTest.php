<?php

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
            ->assertJson(['message' => 'Obra não disponível.']);
    }

    public function test_checkout_creates_order_and_returns_pix_data(): void
    {
        $artwork = Artwork::factory()->create(['price' => 1000]);

        $this->mock(PaymentService::class, function ($mock) {
            $mock->shouldReceive('createPayment')->once()->andReturn([
                'mp_payment_id'    => 'mp_test_123',
                'status'           => 'pending',
                'payment_method'   => 'pix',
                'pix_qr_code'      => 'base64_qr',
                'pix_qr_code_text' => 'pix_copy_paste',
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
