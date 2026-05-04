<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('valores_campos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('processo_id')
                ->constrained('processos')
                ->cascadeOnDelete();
            $table->foreignId('campo_personalizado_id')
                ->constrained('campos_personalizados')
                ->cascadeOnDelete();
            $table->text('valor')->nullable();
            $table->timestamps();

            $table->unique(['processo_id', 'campo_personalizado_id'], 'valor_unico');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('valores_campos');
    }
};
