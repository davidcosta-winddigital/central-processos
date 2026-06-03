<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Servidor;
use App\Services\MetricasServidor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InfraController extends Controller
{
    /**
     * Carga inicial do dashboard: snapshot atual de cada servidor.
     * Atualizações seguintes chegam em tempo real via WebSocket.
     */
    public function metricas(MetricasServidor $svc): JsonResponse
    {
        return response()->json([
            'servidores' => $svc->todos(),
            'ts'         => now()->toIso8601String(),
        ]);
    }

    /**
     * Ingestão de métricas REAIS enviadas pelos agentes.
     * Autenticada pelo token do servidor (header X-Server-Token), sem login.
     */
    public function ingest(Request $request, MetricasServidor $svc): JsonResponse
    {
        $token = $request->header('X-Server-Token') ?? $request->input('token');

        $servidor = $token ? Servidor::where('token', $token)->where('tipo', 'agente')->first() : null;
        if (! $servidor) {
            return response()->json(['message' => 'Token inválido.'], 401);
        }

        $dados = $request->validate([
            'nome'          => ['nullable', 'string', 'max:255'],
            'host'          => ['nullable', 'string', 'max:255'],
            'cpu'           => ['required', 'numeric', 'min:0', 'max:100'],
            'mem_total_mb'  => ['nullable', 'numeric', 'min:0'],
            'mem_used_mb'   => ['nullable', 'numeric', 'min:0'],
            'disk_total_gb' => ['nullable', 'numeric', 'min:0'],
            'disk_used_gb'  => ['nullable', 'numeric', 'min:0'],
            'net_rx_mbps'   => ['nullable', 'numeric', 'min:0'],
            'net_tx_mbps'   => ['nullable', 'numeric', 'min:0'],
            'uptime_s'      => ['nullable', 'numeric', 'min:0'],
            'load'          => ['nullable', 'array'],
            'load.*'        => ['numeric'],
            'top'           => ['nullable', 'array'],
            'top.*.nome'    => ['required_with:top', 'string', 'max:100'],
            'top.*.cpu'     => ['nullable', 'numeric'],
            'top.*.memoria' => ['nullable', 'numeric'],
        ]);

        // Identidade reportada pelo próprio servidor (nome/IP) — atualiza se mudou.
        $patch = [];
        if (! empty($dados['nome']) && $dados['nome'] !== $servidor->nome) {
            $patch['nome'] = $dados['nome'];
        }
        if (! empty($dados['host']) && $dados['host'] !== $servidor->host) {
            $patch['host'] = $dados['host'];
        }
        if ($patch) {
            $servidor->update($patch);
        }

        $svc->registrarReal($servidor, $dados);
        $svc->transmitir();

        return response()->json(['ok' => true]);
    }

    /** Serve o script do agente (público; o segredo é o token, fornecido em runtime). */
    public function agente(string $plataforma): Response
    {
        $arquivos = ['linux' => 'linux.sh', 'windows' => 'windows.ps1', 'freebsd' => 'freebsd.sh'];
        abort_unless(isset($arquivos[$plataforma]), 404);

        $path = resource_path('agentes/' . $arquivos[$plataforma]);
        abort_unless(is_file($path), 404);

        return response(file_get_contents($path), 200)
            ->header('Content-Type', 'text/plain; charset=utf-8');
    }
}
