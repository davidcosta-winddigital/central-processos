<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processo_relacionamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('origem_id')
                ->constrained('processos')
                ->cascadeOnDelete();
            $table->foreignId('destino_id')
                ->constrained('processos')
                ->cascadeOnDelete();
            $table->enum('tipo', [
                'pre_requisito',
                'decorre_de',
                'relacionado',
                'subprocesso_de',
            ])->default('relacionado');
            $table->string('observacao', 500)->nullable();
            $table->timestamps();

            $table->unique(['origem_id', 'destino_id', 'tipo'], 'rel_unico');
            $table->index('destino_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processo_relacionamentos');
    }
};
