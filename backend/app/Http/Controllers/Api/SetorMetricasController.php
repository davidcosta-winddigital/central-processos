<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SetorMetricasController extends Controller
{
    public function show(Request $request, Setor $setor): JsonResponse
    {
        abort_unless($request->user()->hasSetorAccess($setor), 403);

        $processosIds = $setor->processos()->pluck('id');
        $totalProcessos = $processosIds->count();

        // Total de etapas (apenas para informação geral, sem distinção concluídas/pendentes)
        $totalEtapas = DB::table('etapas')
            ->whereIn('processo_id', $processosIds)
            ->count();

        $totalCampos    = $setor->campos()->count();
        $totalMembros   = $setor->users()->count();

        // Processos recentes (últimos 5 criados)
        $recentes = $setor->processos()
            ->withCount('etapas')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'titulo', 'created_at']);

        return response()->json([
            'totais' => [
                'processos' => $totalProcessos,
                'membros'   => $totalMembros,
                'campos'    => $totalCampos,
                'etapas'    => $totalEtapas,
            ],
            'recentes' => $recentes,
        ]);
    }
}
