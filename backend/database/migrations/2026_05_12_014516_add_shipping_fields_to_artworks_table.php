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
