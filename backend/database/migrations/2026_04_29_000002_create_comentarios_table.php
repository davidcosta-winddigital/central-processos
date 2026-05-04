<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comentarios', function (Blueprint $table) {
            $table->id();
            $table->morphs('comentavel'); // comentavel_type, comentavel_id (Processo, Etapa)
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('comentarios')
                ->nullOnDelete();
            $table->text('conteudo');
            $table->json('mencoes')->nullable(); // [user_id, ...]
            $table->timestamp('editado_em')->nullable();
            $table->timestamps();

            $table->index(['comentavel_type', 'comentavel_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comentarios');
    }
};
