<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campos_personalizados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setor_id')
                ->constrained('setores')
                ->cascadeOnDelete();
            $table->string('nome');
            $table->string('rotulo');
            $table->enum('tipo', ['texto', 'numero', 'data', 'selecao']);
            $table->json('opcoes')->nullable();
            $table->boolean('obrigatorio')->default(false);
            $table->unsignedInteger('ordem')->default(0);
            $table->timestamps();

            $table->unique(['setor_id', 'nome']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campos_personalizados');
    }
};
