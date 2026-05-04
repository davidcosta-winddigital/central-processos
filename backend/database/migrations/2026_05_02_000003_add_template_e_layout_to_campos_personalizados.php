<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campos_personalizados', function (Blueprint $table) {
            $table->foreignId('template_id')
                ->nullable()
                ->after('setor_id')
                ->constrained('templates_processo')
                ->cascadeOnDelete();

            $table->string('secao')->nullable()->after('rotulo');         // ex.: "Dados Pessoais"
            $table->unsignedTinyInteger('coluna')->default(1)->after('secao'); // 1 ou 2
            $table->text('ajuda')->nullable()->after('coluna');           // dica para o usuário
            $table->json('regras')->nullable()->after('opcoes');          // validação/condicional/máscara

            $table->index(['setor_id', 'template_id']);
        });
    }

    public function down(): void
    {
        Schema::table('campos_personalizados', function (Blueprint $table) {
            $table->dropForeign(['template_id']);
            $table->dropIndex(['setor_id', 'template_id']);
            $table->dropColumn(['template_id', 'secao', 'coluna', 'ajuda', 'regras']);
        });
    }
};
