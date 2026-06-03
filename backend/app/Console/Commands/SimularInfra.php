<?php

namespace App\Console\Commands;

use App\Models\Servidor;
use App\Services\MetricasServidor;
use Illuminate\Console\Command;

class SimularInfra extends Command
{
    protected $signature = 'infra:simular {--intervalo=3 : Segundos entre cada ciclo}';

    protected $description = 'Gera métricas dos servidores simulados e transmite o estado (inclui servidores reais) via WebSocket.';

    public function handle(MetricasServidor $svc): int
    {
        $intervalo = max(1, (int) $this->option('intervalo'));
        $this->info("Ciclo de métricas a cada {$intervalo}s. Ctrl+C para parar.");

        while (true) {
            // Só os simulados têm valores gerados aqui; os reais vêm via ingestão.
            Servidor::where('ativo', true)->where('tipo', 'simulado')->get()
                ->each(fn (Servidor $s) => $svc->proximaSimulada($s));

            try {
                $svc->transmitir();
            } catch (\Throwable $e) {
                $this->error('Falha ao transmitir: ' . $e->getMessage());
            }

            sleep($intervalo);
        }

        return self::SUCCESS;
    }
}
