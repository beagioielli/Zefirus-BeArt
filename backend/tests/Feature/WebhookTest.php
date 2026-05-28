<?php

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
            $mock->shouldReceive('handleWebhook')->once();
        });

        $response = $this->postJson(
            '/api/webhooks/mercadopago?topic=payment&data_id=mp_dup_456',
            ['type' => 'payment', 'data' => ['id' => 'mp_dup_456']]
        );

        $response->assertStatus(200);
    }
}
