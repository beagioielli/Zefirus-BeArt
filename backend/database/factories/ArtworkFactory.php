<?php

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
