<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CampoPermissao;
use App\Models\CampoPersonalizado;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CampoPermissaoController extends Controller
{
    public function index(Request $request, CampoPersonalizado $campo): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $perms = $campo->permissoes()->get()->keyBy('papel');

        // Garante que todas as roles aparecem na resposta (com defaults).
        $payload = collect(User::PAPEIS)->map(function ($papel) use ($perms) {
            $p = $perms->get($papel);
            return [
                'papel'       => $papel,
                'pode_ver'    => $p?->pode_ver ?? true,
                'pode_editar' => $p?->pode_editar ?? true,
            ];
        });

        return response()->json($payload->values());
    }

    public function update(Request $request, CampoPersonalizado $campo): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $request->validate([
            'permissoes'              => ['required', 'array'],
            'permissoes.*.papel'      => ['required', Rule::in(User::PAPEIS)],
            'permissoes.*.pode_ver'   => ['required', 'boolean'],
            'permissoes.*.pode_editar' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($campo, $data) {
            foreach ($data['permissoes'] as $p) {
                CampoPermissao::updateOrCreate(
                    [
                        'campo_personalizado_id' => $campo->id,
                        'papel'                  => $p['papel'],
                    ],
                    [
                        'pode_ver'    => $p['pode_ver'],
                        'pode_editar' => $p['pode_editar'],
                    ],
                );
            }
        });

        return response()->json(['message' => 'Permissões atualizadas.']);
    }
}
