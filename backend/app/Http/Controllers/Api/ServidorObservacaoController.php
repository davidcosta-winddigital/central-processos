<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Servidor;
use App\Models\ServidorObservacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServidorObservacaoController extends Controller
{
    public function index(Servidor $servidor): JsonResponse
    {
        return response()->json($servidor->observacoes()->get());
    }

    public function store(Request $request, Servidor $servidor): JsonResponse
    {
        $data = $request->validate([
            'texto' => ['required', 'string', 'max:2000'],
        ]);

        $obs = $servidor->observacoes()->create([
            'texto'   => $data['texto'],
            'user_id' => $request->user()->id,
            'autor'   => $request->user()->name,
        ]);

        return response()->json($obs, 201);
    }

    public function destroy(ServidorObservacao $observacao): JsonResponse
    {
        $observacao->delete();

        return response()->json(null, 204);
    }
}
