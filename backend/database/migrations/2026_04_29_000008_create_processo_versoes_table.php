<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processo_versoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('processo_id')
                ->constrained('processos')
                ->cascadeOnDelete();
            $table->unsignedInteger('numero_versao');
            $table->json('snapshot'); // dados completos do processo + etapas + campos
            $table->foreignId('editor_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('motivo', 500)->nullable();
            $table->timestamps();

            $table->unique(['processo_id', 'numero_versao']);
            $table->index(['processo_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processo_versoes');
    }
};
