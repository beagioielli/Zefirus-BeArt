<?php

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
