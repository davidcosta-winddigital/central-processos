<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('slug')->unique();
            $table->string('cor', 9)->default('#6366f1');
            $table->timestamps();

            $table->index('nome');
        });

        Schema::create('processo_tag', function (Blueprint $table) {
            $table->foreignId('processo_id')
                ->constrained('processos')
                ->cascadeOnDelete();
            $table->foreignId('tag_id')
                ->constrained('tags')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['processo_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processo_tag');
        Schema::dropIfExists('tags');
    }
};
