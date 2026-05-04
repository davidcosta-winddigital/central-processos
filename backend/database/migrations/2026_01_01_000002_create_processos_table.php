<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setor_id')
                ->constrained('setores')
                ->cascadeOnDelete();
            $table->string('titulo');
            $table->text('descricao')->nullable();
            $table->timestamps();

            $table->index('setor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processos');
    }
};
