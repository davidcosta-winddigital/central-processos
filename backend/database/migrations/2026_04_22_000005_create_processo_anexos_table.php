<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processo_anexos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('processo_id')->constrained('processos')->cascadeOnDelete();
            $table->string('nome_original');
            $table->string('caminho');
            $table->string('tipo_mime', 100)->nullable();
            $table->unsignedBigInteger('tamanho')->nullable();
            $table->timestamps();
            $table->index('processo_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processo_anexos');
    }
};
