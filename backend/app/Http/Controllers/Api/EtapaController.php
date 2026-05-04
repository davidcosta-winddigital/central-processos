<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Etapa;
use App\Models\Processo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EtapaController extends Controller
{
    public function index(Request $request, Processo $processo): JsonResponse
    {
        $this->authorize('view', $processo);
        return response()->json($processo->etapas()->get());
    }

    public function store(Request $request, Processo $processo): JsonResponse
    {
        $this->authorize('update', $processo);

        $data = $request->validate([
            'titulo'    => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'ordem'     => ['nullable', 'integer', 'min:0'],
        ]);

        $data['ordem'] ??= (int) $processo->etapas()->max('ordem') + 1;

        $etapa = $processo->etapas()->create($data);

        return response()->json($etapa, 201);
    }

    public function show(Etapa $etapa): JsonResponse
    {
        $this->authorize('view', $etapa);
        return response()->json($etapa);
    }

    public function update(Request $request, Etapa $etapa): JsonResponse
    {
        $this->authorize('update', $etapa);

        $data = $request->validate([
            'titulo'    => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'ordem'     => ['nullable', 'integer', 'min:0'],
        ]);

        $etapa->update($data);

        return response()->json($etapa);
    }

    public function destroy(Etapa $etapa): JsonResponse
    {
        $this->authorize('delete', $etapa);
        $etapa->delete();

        return response()->json(null, 204);
    }
}
