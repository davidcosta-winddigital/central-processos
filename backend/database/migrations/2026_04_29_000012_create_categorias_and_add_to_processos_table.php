<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setor_id')
                ->constrained('setores')
                ->cascadeOnDelete();
            $table->string('nome');
            $table->string('cor', 9)->default('#64748b');
            $table->unsignedInteger('ordem')->default(0);
            $table->timestamps();

            $table->unique(['setor_id', 'nome']);
            $table->index(['setor_id', 'ordem']);
        });

        Schema::table('processos', function (Blueprint $table) {
            $table->foreignId('categoria_id')
                ->nullable()
                ->after('setor_id')
                ->constrained('categorias')
                ->nullOnDelete();

            $table->index('categoria_id');
        });
    }

    public function down(): void
    {
        Schema::table('processos', function (Blueprint $table) {
            $table->dropForeign(['categoria_id']);
            $table->dropIndex(['categoria_id']);
            $table->dropColumn('categoria_id');
        });

        Schema::dropIfExists('categorias');
    }
};
