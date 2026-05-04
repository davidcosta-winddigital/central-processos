<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditorias', function (Blueprint $table) {
            $table->id();
            $table->morphs('auditavel'); // auditavel_type, auditavel_id
            $table->string('evento'); // criado, atualizado, removido, concluido, restaurado, ...
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->json('alteracoes')->nullable(); // diff before/after
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();

            $table->index(['auditavel_type', 'auditavel_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('evento');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditorias');
    }
};
