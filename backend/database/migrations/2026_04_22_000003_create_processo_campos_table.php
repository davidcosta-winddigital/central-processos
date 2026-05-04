<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processo_campos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('processo_id')->constrained('processos')->cascadeOnDelete();
            $table->string('nome');
            $table->string('rotulo');
            $table->enum('tipo', ['texto', 'numero', 'data', 'selecao'])->default('texto');
            $table->json('opcoes')->nullable();
            $table->boolean('obrigatorio')->default(false);
            $table->unsignedInteger('ordem')->default(0);
            $table->text('valor')->nullable();
            $table->timestamps();
            $table->unique(['processo_id', 'nome']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processo_campos');
    }
};
