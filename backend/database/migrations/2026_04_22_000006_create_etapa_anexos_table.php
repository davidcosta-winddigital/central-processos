<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('etapa_anexos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('etapa_id')->constrained('etapas')->cascadeOnDelete();
            $table->string('nome_original');
            $table->string('caminho');
            $table->string('tipo_mime', 150);
            $table->unsignedBigInteger('tamanho');
            $table->timestamps();

            $table->index('etapa_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etapa_anexos');
    }
};