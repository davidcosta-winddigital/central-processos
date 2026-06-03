<?php

namespace Database\Seeders;

use App\Models\Setor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Cria/atualiza o administrador principal e o vincula ao setor de Tecnologia
     * (necessário para acessar o dashboard de Infraestrutura).
     * Rode com: php artisan db:seed --class=AdminUserSeeder
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'david.costa@winddigital.com.br'],
            ['name' => 'David Costa', 'password' => Hash::make('admin'), 'role' => 'admin']
        );

        $ti = Setor::where('nome', 'like', '%Tecnologia%')->first();
        if ($ti) {
            $user->setores()->syncWithoutDetaching([$ti->id => ['papel' => 'admin']]);
        }

        $this->command?->info("Admin pronto: {$user->email} (id {$user->id}) — setor TI: " . ($ti?->nome ?? 'não encontrado'));
    }
}
