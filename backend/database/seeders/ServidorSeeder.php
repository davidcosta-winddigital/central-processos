<?php

namespace Database\Seeders;

use App\Models\Servidor;
use Illuminate\Database\Seeder;

class ServidorSeeder extends Seeder
{
    /**
     * Frota de servidores (simulada). Rode com:
     * php artisan db:seed --class=ServidorSeeder
     */
    public function run(): void
    {
        $frota = [
            ['nome' => 'web-prod-01',   'host' => '10.0.1.11', 'ambiente' => 'Produção',     'so' => 'Ubuntu 22.04 LTS',     'cpu_nucleos' => 8,  'memoria_total_mb' => 16384, 'disco_total_gb' => 200],
            ['nome' => 'web-prod-02',   'host' => '10.0.1.12', 'ambiente' => 'Produção',     'so' => 'Ubuntu 22.04 LTS',     'cpu_nucleos' => 8,  'memoria_total_mb' => 16384, 'disco_total_gb' => 200],
            ['nome' => 'db-prod-01',    'host' => '10.0.1.20', 'ambiente' => 'Produção',     'so' => 'Debian 12',           'cpu_nucleos' => 16, 'memoria_total_mb' => 65536, 'disco_total_gb' => 1000, 'limite_disco' => 80],
            ['nome' => 'cache-redis-01','host' => '10.0.1.30', 'ambiente' => 'Produção',     'so' => 'Alpine 3.19',         'cpu_nucleos' => 4,  'memoria_total_mb' => 8192,  'disco_total_gb' => 50],
            ['nome' => 'app-homolog-01','host' => '10.0.2.10', 'ambiente' => 'Homologação',  'so' => 'Windows Server 2022', 'cpu_nucleos' => 4,  'memoria_total_mb' => 8192,  'disco_total_gb' => 120],
            ['nome' => 'storage-01',    'host' => '10.0.1.40', 'ambiente' => 'Produção',     'so' => 'TrueNAS Scale',       'cpu_nucleos' => 6,  'memoria_total_mb' => 32768, 'disco_total_gb' => 4000, 'limite_disco' => 75],
        ];

        foreach ($frota as $s) {
            Servidor::updateOrCreate(['nome' => $s['nome']], $s);
        }

        $this->command?->info('Frota de servidores: '.count($frota).' registros.');
    }
}
