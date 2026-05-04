<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('tipo'); // ex.: comentario_mencao, etapa_concluida, prazo_proximo
            $table->string('titulo');
            $table->text('mensagem')->nullable();
            $table->nullableMorphs('referente'); // ex.: Processo, Etapa, Comentario
            $table->json('payload')->nullable();
            $table->timestamp('lida_em')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'lida_em']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificacoes');
    }
};
