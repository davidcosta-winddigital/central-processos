<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servidores', function (Blueprint $table) {
            // 'simulado' (demo) ou 'agente' (servidor real reportando via token)
            $table->string('tipo', 20)->default('simulado')->after('ambiente');
            $table->string('token', 64)->nullable()->unique()->after('tipo');
            $table->unsignedSmallInteger('intervalo_segundos')->default(5)->after('disco_total_gb');
        });
    }

    public function down(): void
    {
        Schema::table('servidores', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'token', 'intervalo_segundos']);
        });
    }
};
