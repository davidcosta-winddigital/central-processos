<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('etapas', function (Blueprint $table) {
            $table->index(['processo_id', 'concluida'], 'etapas_processo_concluida_idx');
        });
    }

    public function down(): void
    {
        Schema::table('etapas', function (Blueprint $table) {
            $table->dropIndex('etapas_processo_concluida_idx');
        });
    }
};
