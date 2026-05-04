<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('processos', function (Blueprint $table) {
            $table->foreignId('template_id')
                ->nullable()
                ->after('setor_id')
                ->constrained('templates_processo')
                ->nullOnDelete();
            $table->index(['setor_id', 'template_id']);
        });
    }

    public function down(): void
    {
        Schema::table('processos', function (Blueprint $table) {
            $table->dropForeign(['template_id']);
            $table->dropIndex(['setor_id', 'template_id']);
            $table->dropColumn('template_id');
        });
    }
};
