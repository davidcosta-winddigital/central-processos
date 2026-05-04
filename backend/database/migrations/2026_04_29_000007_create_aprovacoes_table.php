<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aprovacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('etapa_id')
                ->constrained('etapas')
                ->cascadeOnDelete();
            $table->foreignId('aprovador_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('solicitante_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->enum('status', ['pendente', 'aprovado', 'recusado'])->default('pendente');
            $table->text('comentario')->nullable();
            $table->timestamp('decidido_em')->nullable();
            $table->timestamps();

            $table->index(['aprovador_id', 'status']);
            $table->index(['etapa_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aprovacoes');
    }
};
