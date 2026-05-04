<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Convertemos a coluna `tipo` de enum para varchar(32) para suportar novos tipos.
        // Usamos SQL bruto para evitar a dependência doctrine/dbal do change().
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE campos_personalizados MODIFY COLUMN tipo VARCHAR(32) NOT NULL");
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE campos_personalizados ALTER COLUMN tipo TYPE VARCHAR(32)');
        } elseif ($driver === 'sqlite') {
            // SQLite trata enum como TEXT — nada a fazer.
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE campos_personalizados MODIFY COLUMN tipo ENUM('texto','numero','data','selecao') NOT NULL");
        }
    }
};
