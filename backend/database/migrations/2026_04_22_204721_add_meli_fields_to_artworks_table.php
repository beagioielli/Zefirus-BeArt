<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artworks', function (Blueprint $table) {
            $table->string('meli_category_id')->nullable();
            $table->string('meli_condition')->default('new')->nullable();
            $table->string('meli_listing_type')->default('gold_special')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('artworks', function (Blueprint $table) {
            $table->dropColumn(['meli_category_id', 'meli_condition', 'meli_listing_type']);
        });
    }
};
