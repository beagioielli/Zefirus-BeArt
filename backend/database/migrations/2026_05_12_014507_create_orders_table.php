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
