<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('servidores', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('host')->nullable();          // IP/hostname (exibição)
            $table->string('ambiente')->default('Produção');
            $table->string('so')->nullable();            // sistema operacional
            $table->unsignedSmallInteger('cpu_nucleos')->default(4);
            $table->unsignedInteger('memoria_total_mb')->default(8192);
            $table->unsignedInteger('disco_total_gb')->default(100);
            // Limiares de alerta por componente (% de uso)
            $table->unsignedTinyInteger('limite_cpu')->default(85);
            $table->unsignedTinyInteger('limite_memoria')->default(85);
            $table->unsignedTinyInteger('limite_disco')->default(90);
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servidores');
    }
};
