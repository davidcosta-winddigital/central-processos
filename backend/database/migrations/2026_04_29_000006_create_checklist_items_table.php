<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('etapa_id')
                ->constrained('etapas')
                ->cascadeOnDelete();
            $table->string('descricao');
            $table->boolean('concluido')->default(false);
            $table->timestamp('concluido_em')->nullable();
            $table->foreignId('concluido_por_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->unsignedInteger('ordem')->default(0);
            $table->timestamps();

            $table->index(['etapa_id', 'ordem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_items');
    }
};
