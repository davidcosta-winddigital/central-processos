<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SetorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Setor::query()
            ->withCount(['processos', 'campos'])
            ->orderBy('nome');

        if (! $user->isAdmin()) {
            $ids = $user->setores()->pluck('setores.id');
            $query->whereIn('id', $ids);
        }

        $setores = $query->get()->map(function (Setor $setor) use ($user) {
            $arr = $setor->toArray();
            $arr['papel']      = $user->papelEm($setor);
            $arr['permissoes'] = $this->permissoesSetor($user, $setor);
            return $arr;
        });

        return response()->json($setores);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Apenas administradores podem criar setores.');

        $data = $request->validate([
            'nome'      => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
        ]);

        return response()->json(Setor::create($data), 201);
    }

    public function show(Request $request, Setor $setor): JsonResponse
    {
        $this->authorize('view', $setor);
        $user = $request->user();

        $setor->load(['campos', 'processos' => function ($q) {
            $q->withCount('etapas');
        }]);

        $arr = $setor->toArray();
        $arr['papel']      = $user->papelEm($setor);
        $arr['permissoes'] = $this->permissoesSetor($user, $setor);

        return response()->json($arr);
    }

    public function update(Request $request, Setor $setor): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Apenas administradores podem editar setores.');

        $data = $request->validate([
            'nome'      => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
        ]);

        $setor->update($data);

        return response()->json($setor);
    }

    public function destroy(Request $request, Setor $setor): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Apenas administradores podem excluir setores.');

        $setor->delete();

        return response()->json(null, 204);
    }

    private function permissoesSetor($user, Setor $setor): array
    {
        return [
            'ver'             => $user->papelTemNivelMinimo($setor, 'viewer'),
            'criar_processo'  => $user->papelTemNivelMinimo($setor, 'editor'),
            'editar_processo' => $user->papelTemNivelMinimo($setor, 'editor'),
            'excluir_processo'=> $user->papelTemNivelMinimo($setor, 'manager'),
            'aprovar'         => $user->papelTemNivelMinimo($setor, 'manager'),
            'gerir_campos'    => $user->isAdmin(),
            'gerir_setor'     => $user->isAdmin(),
        ];
    }
}
