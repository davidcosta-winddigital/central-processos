<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('evento'); // ex.: processo.criado, etapa.concluida, aprovacao.decidida
            $table->string('url', 500);
            $table->string('secret', 64)->nullable(); // assinatura HMAC
            $table->boolean('ativo')->default(true);
            $table->unsignedInteger('falhas_consecutivas')->default(0);
            $table->timestamp('ultimo_disparo_em')->nullable();
            $table->timestamps();

            $table->index(['evento', 'ativo']);
        });

        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_id')
                ->constrained('webhooks')
                ->cascadeOnDelete();
            $table->string('evento');
            $table->json('payload');
            $table->unsignedSmallInteger('status_http')->nullable();
            $table->text('resposta')->nullable();
            $table->timestamp('disparado_em');
            $table->timestamps();

            $table->index(['webhook_id', 'disparado_em']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
        Schema::dropIfExists('webhooks');
    }
};
