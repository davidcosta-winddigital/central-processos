<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('etapas', function (Blueprint $table) {
            $table->foreignId('responsavel_id')
                ->nullable()
                ->after('descricao')
                ->constrained('users')
                ->nullOnDelete();
            $table->unsignedSmallInteger('prazo_dias')->nullable()->after('responsavel_id');
            $table->timestamp('prazo_em')->nullable()->after('prazo_dias');
            $table->boolean('requer_aprovacao')->default(false)->after('prazo_em');

            $table->index(['responsavel_id', 'concluida']);
            $table->index('prazo_em');
        });
    }

    public function down(): void
    {
        Schema::table('etapas', function (Blueprint $table) {
            $table->dropForeign(['responsavel_id']);
            $table->dropIndex(['responsavel_id', 'concluida']);
            $table->dropIndex(['prazo_em']);
            $table->dropColumn(['responsavel_id', 'prazo_dias', 'prazo_em', 'requer_aprovacao']);
        });
    }
};
