<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Guarda os cadastros pendentes de confirmação por código de e-mail.
     * O usuário só é criado na tabela `users` após validar o código.
     */
    public function up(): void
    {
        Schema::create('registro_verificacoes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');           // já vem com hash (bcrypt)
            $table->string('codigo');             // hash do código de 6 dígitos
            $table->unsignedTinyInteger('tentativas')->default(0);
            $table->timestamp('expira_em');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registro_verificacoes');
    }
};
