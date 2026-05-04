<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('setor_user', function (Blueprint $table) {
            $table->enum('papel', ['viewer', 'editor', 'manager', 'admin'])
                ->default('viewer')
                ->after('user_id');
            $table->index(['user_id', 'papel']);
        });
    }

    public function down(): void
    {
        Schema::table('setor_user', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'papel']);
            $table->dropColumn('papel');
        });
    }
};
