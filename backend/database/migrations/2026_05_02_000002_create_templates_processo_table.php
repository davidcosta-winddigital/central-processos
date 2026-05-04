<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('templates_processo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setor_id')->constrained('setores')->cascadeOnDelete();
            $table->string('nome');
            $table->string('slug');
            $table->text('descricao')->nullable();
            $table->string('icone', 16)->nullable();         // emoji opcional
            $table->string('cor', 16)->nullable();           // ex.: '#0ea5e9'
            $table->boolean('ativo')->default(true);
            $table->json('etapas_padrao')->nullable();       // [{titulo, descricao}]
            $table->timestamps();

            $table->unique(['setor_id', 'slug']);
            $table->index(['setor_id', 'ativo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('templates_processo');
    }
};
