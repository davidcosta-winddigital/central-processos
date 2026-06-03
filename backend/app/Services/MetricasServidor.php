<?php

namespace App\Services;

use App\Events\MetricasAtualizadas;
use App\Models\Servidor;
use Illuminate\Support\Facades\Cache;

/**
 * Centraliza as métricas dos servidores:
 *  - tipo 'simulado': gera valores fake (random walk);
 *  - tipo 'agente'  : recebe valores reais via endpoint de ingestão;
 *  - monta snapshots padronizados (com alertas/status) e transmite via WebSocket.
 */
class MetricasServidor
{
    private const ESTADO = 'infra:estado:';     // random walk dos simulados
    private const SNAP   = 'infra:snapshot:';   // último snapshot por servidor
    private const TTL    = 600;

    private const PROCESSOS = [
        'nginx', 'php-fpm', 'mysqld', 'redis-server', 'node',
        'dockerd', 'systemd', 'java', 'python3', 'postgres',
    ];

    // ── SIMULADO ──────────────────────────────────────────────────────────────
    public function proximaSimulada(Servidor $s): array
    {
        $e = Cache::get(self::ESTADO . $s->id, $this->estadoInicial());

        $e['cpu']     = $this->passo($e['cpu'],     8,   2, 99);
        $e['mem']     = $this->passo($e['mem'],     5,   8, 98);
        $e['disco']   = $this->passo($e['disco'],   0.4, 5, 99);
        $e['rede_rx'] = $this->passo($e['rede_rx'], 40,  0, 950);
        $e['rede_tx'] = $this->passo($e['rede_tx'], 30,  0, 950);
        $e['uptime']  = $e['uptime'] + mt_rand(2, 4);

        Cache::put(self::ESTADO . $s->id, $e, self::TTL);

        $snap = $this->montar($s, [
            'cpu'     => $e['cpu'],
            'mem'     => $e['mem'],
            'disco'   => $e['disco'],
            'rede_rx' => $e['rede_rx'],
            'rede_tx' => $e['rede_tx'],
            'uptime'  => $e['uptime'],
            'top'     => $this->topSimulado($e['cpu'], $e['mem']),
            'online'  => true,
        ]);

        Cache::put(self::SNAP . $s->id, $snap, self::TTL);
        return $snap;
    }

    // ── REAL (agente) ───────────────────────────────────────────────────────────
    public function registrarReal(Servidor $s, array $p): array
    {
        $memTotal  = (int) ($p['mem_total_mb']  ?? $s->memoria_total_mb);
        $memUsed   = (int) ($p['mem_used_mb']   ?? 0);
        $diskTotal = (int) ($p['disk_total_gb'] ?? $s->disco_total_gb);
        $diskUsed  = (int) ($p['disk_used_gb']  ?? 0);

        $snap = $this->montar($s, [
            'cpu'           => round((float) ($p['cpu'] ?? 0), 1),
            'mem'           => $memTotal > 0 ? round($memUsed / $memTotal * 100, 1) : 0,
            'disco'         => $diskTotal > 0 ? round($diskUsed / $diskTotal * 100, 1) : 0,
            'mem_total_mb'  => $memTotal,
            'mem_used_mb'   => $memUsed,
            'disk_total_gb' => $diskTotal,
            'disk_used_gb'  => $diskUsed,
            'rede_rx'       => round((float) ($p['net_rx_mbps'] ?? 0), 1),
            'rede_tx'       => round((float) ($p['net_tx_mbps'] ?? 0), 1),
            'uptime'        => (int) ($p['uptime_s'] ?? 0),
            'load'          => is_array($p['load'] ?? null) ? array_map('floatval', $p['load']) : null,
            'top'           => $this->normalizarTop($p['top'] ?? []),
            'online'        => true,
        ]);

        Cache::put(self::SNAP . $s->id, $snap, self::TTL);
        return $snap;
    }

    // ── LEITURA ATUAL (dashboard) ─────────────────────────────────────────────
    public function atual(Servidor $s): array
    {
        $snap = Cache::get(self::SNAP . $s->id);

        if ($s->tipo === 'simulado') {
            return $snap ?? $this->proximaSimulada($s);
        }

        // agente: sem dados ou dados velhos => offline
        if (! $snap) {
            return $this->offline($s);
        }
        // Tolera ~2,5 ciclos sem reportar antes de marcar offline (mín. 150s p/ cron de 1 min).
        $limite = max(150, (int) round($s->intervalo_segundos * 2.5));
        if (now()->timestamp - ($snap['recebido_ts'] ?? 0) > $limite) {
            $snap['status'] = 'offline';
            $snap['online'] = false;
            $snap['alertas'] = [];
        }
        return $snap;
    }

    /** @return array<int,array> */
    public function todos(): array
    {
        return Servidor::where('ativo', true)->orderBy('nome')->get()
            ->map(fn (Servidor $s) => $this->atual($s))
            ->all();
    }

    public function transmitir(): void
    {
        event(new MetricasAtualizadas($this->todos()));
    }

    // ── MONTAGEM DO SNAPSHOT ──────────────────────────────────────────────────
    public function montar(Servidor $s, array $v): array
    {
        $cpu   = (float) ($v['cpu'] ?? 0);
        $mem   = (float) ($v['mem'] ?? 0);
        $disco = (float) ($v['disco'] ?? 0);

        [$alertas, $status] = $this->avaliarAlertas($s, $cpu, $mem, $disco);

        $memTotal  = (int) ($v['mem_total_mb']  ?? $s->memoria_total_mb);
        $memUsed   = (int) ($v['mem_used_mb']   ?? round($memTotal * $mem / 100));
        $diskTotal = (int) ($v['disk_total_gb'] ?? $s->disco_total_gb);
        $diskUsed  = (int) ($v['disk_used_gb']  ?? round($diskTotal * $disco / 100));

        $load = $v['load'] ?? [
            round($cpu / 100 * $s->cpu_nucleos, 2),
            round($cpu / 100 * $s->cpu_nucleos * (0.9 + mt_rand(0, 20) / 100), 2),
            round($cpu / 100 * $s->cpu_nucleos * (0.8 + mt_rand(0, 20) / 100), 2),
        ];

        return [
            'servidor_id'      => $s->id,
            'nome'             => $s->nome,
            'host'             => $s->host,
            'ambiente'         => $s->ambiente,
            'so'               => $s->so,
            'tipo'             => $s->tipo,
            'online'           => $v['online'] ?? true,
            'status'           => $status,

            'cpu_nucleos'      => $s->cpu_nucleos,
            'cpu_percent'      => $cpu,

            'memoria_total_mb' => $memTotal,
            'memoria_usada_mb' => $memUsed,
            'memoria_percent'  => $mem,

            'disco_total_gb'   => $diskTotal,
            'disco_usado_gb'   => $diskUsed,
            'disco_percent'    => $disco,

            'rede_rx_mbps'     => round((float) ($v['rede_rx'] ?? 0), 1),
            'rede_tx_mbps'     => round((float) ($v['rede_tx'] ?? 0), 1),

            'load_avg'         => $load,
            'uptime_segundos'  => (int) ($v['uptime'] ?? 0),

            'limites'          => [
                'cpu'     => $s->limite_cpu,
                'memoria' => $s->limite_memoria,
                'disco'   => $s->limite_disco,
            ],

            'top_processos'    => $v['top'] ?? [],
            'alertas'          => $alertas,
            'recebido_ts'      => now()->timestamp,
        ];
    }

    private function offline(Servidor $s): array
    {
        return [
            'servidor_id'      => $s->id,
            'nome'             => $s->nome,
            'host'             => $s->host,
            'ambiente'         => $s->ambiente,
            'so'               => $s->so,
            'tipo'             => $s->tipo,
            'online'           => false,
            'status'           => 'offline',
            'cpu_nucleos'      => $s->cpu_nucleos,
            'cpu_percent'      => 0,
            'memoria_total_mb' => $s->memoria_total_mb,
            'memoria_usada_mb' => 0,
            'memoria_percent'  => 0,
            'disco_total_gb'   => $s->disco_total_gb,
            'disco_usado_gb'   => 0,
            'disco_percent'    => 0,
            'rede_rx_mbps'     => 0,
            'rede_tx_mbps'     => 0,
            'load_avg'         => [0, 0, 0],
            'uptime_segundos'  => 0,
            'limites'          => [
                'cpu'     => $s->limite_cpu,
                'memoria' => $s->limite_memoria,
                'disco'   => $s->limite_disco,
            ],
            'top_processos'    => [],
            'alertas'          => [],
            'recebido_ts'      => 0,
        ];
    }

    /** @return array{0:array,1:string} */
    private function avaliarAlertas(Servidor $s, float $cpu, float $mem, float $disco): array
    {
        $alertas = [];
        foreach ([
            ['cpu', $cpu, $s->limite_cpu, 'CPU'],
            ['memoria', $mem, $s->limite_memoria, 'Memória'],
            ['disco', $disco, $s->limite_disco, 'Disco'],
        ] as [$comp, $pct, $limite, $rotulo]) {
            if ($pct >= $limite) {
                $alertas[] = [
                    'componente' => $comp,
                    'nivel'      => $pct >= 95 ? 'critico' : 'alerta',
                    'mensagem'   => "{$rotulo} em {$pct}% (limite {$limite}%)",
                ];
            }
        }

        $status = 'ok';
        if (collect($alertas)->contains('nivel', 'critico')) {
            $status = 'critico';
        } elseif (! empty($alertas)) {
            $status = 'alerta';
        }

        return [$alertas, $status];
    }

    private function normalizarTop(array $top): array
    {
        return collect($top)->take(8)->map(fn ($p) => [
            'nome'    => (string) ($p['nome'] ?? '—'),
            'cpu'     => round((float) ($p['cpu'] ?? 0), 1),
            'memoria' => round((float) ($p['memoria'] ?? 0), 1),
        ])->all();
    }

    // ── helpers do simulado ──────────────────────────────────────────────────
    private function estadoInicial(): array
    {
        return [
            'cpu'     => mt_rand(20, 70),
            'mem'     => mt_rand(30, 75),
            'disco'   => mt_rand(55, 92),
            'rede_rx' => mt_rand(20, 300),
            'rede_tx' => mt_rand(10, 200),
            'uptime'  => mt_rand(3600, 60 * 86400),
        ];
    }

    private function passo(float $atual, float $amplitude, float $min, float $max): float
    {
        $delta = (mt_rand(-1000, 1000) / 1000) * $amplitude;
        return round(max($min, min($max, $atual + $delta)), 1);
    }

    private function topSimulado(float $cpu, float $mem): array
    {
        return collect(self::PROCESSOS)->shuffle()->take(5)->values()
            ->map(function ($nome, $i) use ($cpu, $mem) {
                $fator = [0.5, 0.25, 0.13, 0.08, 0.04][$i] ?? 0.02;
                return [
                    'nome'    => $nome,
                    'cpu'     => round($cpu * $fator * (0.7 + mt_rand(0, 60) / 100), 1),
                    'memoria' => round($mem * $fator * (0.7 + mt_rand(0, 60) / 100), 1),
                ];
            })->all();
    }
}
