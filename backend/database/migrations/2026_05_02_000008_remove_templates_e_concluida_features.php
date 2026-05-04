<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Remove FK e coluna template_id de processos
        if (Schema::hasColumn('processos', 'template_id')) {
            $this->dropForeignSafe('processos', ['template_id']);
            $this->dropIndexSafe('processos', ['setor_id', 'template_id']);
            Schema::table('processos', function (Blueprint $table) {
                $table->dropColumn('template_id');
            });
        }

        // 2) Remove FK e coluna template_id de campos_personalizados
        if (Schema::hasColumn('campos_personalizados', 'template_id')) {
            $this->dropForeignSafe('campos_personalizados', ['template_id']);
            $this->dropIndexSafe('campos_personalizados', ['setor_id', 'template_id']);
            Schema::table('campos_personalizados', function (Blueprint $table) {
                $table->dropColumn('template_id');
            });
        }

        // 3) Drop tabela de templates
        Schema::dropIfExists('templates_processo');

        // 4) Remove índice e colunas de conclusão de etapas.
        // O índice tem nome customizado em uma migration anterior.
        $this->dropIndexByName('etapas', 'etapas_processo_concluida_idx');
        $this->dropIndexByName('etapas', 'etapas_processo_id_concluida_index');

        if (Schema::hasColumn('etapas', 'concluida')) {
            Schema::table('etapas', function (Blueprint $table) {
                $table->dropColumn('concluida');
            });
        }
        if (Schema::hasColumn('etapas', 'concluida_em')) {
            Schema::table('etapas', function (Blueprint $table) {
                $table->dropColumn('concluida_em');
            });
        }
    }

    public function down(): void
    {
        Schema::table('etapas', function (Blueprint $table) {
            if (! Schema::hasColumn('etapas', 'concluida')) {
                $table->boolean('concluida')->default(false);
            }
            if (! Schema::hasColumn('etapas', 'concluida_em')) {
                $table->timestamp('concluida_em')->nullable();
            }
        });
    }

    /**
     * Drop FK só se existir (consulta information_schema do MySQL).
     */
    private function dropForeignSafe(string $table, array $columns): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver !== 'mysql') return;

        $database = DB::connection()->getDatabaseName();
        $constraints = DB::select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = ?
              AND COLUMN_NAME = ?
              AND REFERENCED_TABLE_NAME IS NOT NULL
        ", [$database, $table, $columns[0]]);

        foreach ($constraints as $row) {
            try {
                DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$row->CONSTRAINT_NAME}`");
            } catch (\Throwable $e) { /* ignora */ }
        }
    }

    /**
     * Drop índice baseado no nome convencional Laravel se existir.
     */
    private function dropIndexSafe(string $table, array $columns): void
    {
        $name = $table . '_' . implode('_', $columns) . '_index';
        $this->dropIndexByName($table, $name);
    }

    private function dropIndexByName(string $table, string $name): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver !== 'mysql') return;

        $database = DB::connection()->getDatabaseName();
        $exists = DB::select("
            SELECT 1
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = ?
              AND INDEX_NAME = ?
            LIMIT 1
        ", [$database, $table, $name]);

        if (! empty($exists)) {
            try {
                DB::statement("ALTER TABLE `{$table}` DROP INDEX `{$name}`");
            } catch (\Throwable $e) { /* ignora */ }
        }
    }
};
