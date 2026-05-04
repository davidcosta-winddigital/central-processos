<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campo_permissoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campo_personalizado_id')
                ->constrained('campos_personalizados')
                ->cascadeOnDelete();
            $table->enum('papel', ['viewer', 'editor', 'manager', 'admin']);
            $table->boolean('pode_ver')->default(true);
            $table->boolean('pode_editar')->default(true);
            $table->timestamps();

            $table->unique(['campo_personalizado_id', 'papel'], 'campo_papel_unico');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campo_permissoes');
    }
};
