<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MetricasAtualizadas implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param array $servidores  lista de snapshots de métricas
     */
    public function __construct(public array $servidores) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('infra.servidores')];
    }

    public function broadcastAs(): string
    {
        return 'metricas.atualizadas';
    }

    public function broadcastWith(): array
    {
        return [
            'servidores' => $this->servidores,
            'ts'         => now()->toIso8601String(),
        ];
    }
}
