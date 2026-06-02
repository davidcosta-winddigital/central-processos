<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Cria/atualiza o administrador principal.
     * Rode com: php artisan db:seed --class=AdminUserSeeder
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'david.costa@winddigital.com.br'],
            ['name' => 'David Costa', 'password' => Hash::make('admin'), 'role' => 'admin']
        );

        $this->command?->info("Admin pronto: {$user->email} (id {$user->id}, role {$user->role})");
    }
}
