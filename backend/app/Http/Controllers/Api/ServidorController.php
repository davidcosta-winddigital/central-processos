<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Servidor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ServidorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Servidor::orderBy('nome')->get());
    }

    public function show(Servidor $servidor): JsonResponse
    {
        return response()->json($servidor);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validar($request);

        if (($data['tipo'] ?? 'agente') === 'agente') {
            $data['token'] = $this->novoToken();
        }

        $servidor = Servidor::create($data);

        return response()->json($servidor, 201);
    }

    public function update(Request $request, Servidor $servidor): JsonResponse
    {
        $data = $this->validar($request);

        // Virou agente e ainda não tem token? Gera.
        if (($data['tipo'] ?? $servidor->tipo) === 'agente' && ! $servidor->token) {
            $data['token'] = $this->novoToken();
        }

        $servidor->update($data);

        return response()->json($servidor);
    }

    public function destroy(Servidor $servidor): JsonResponse
    {
        $servidor->delete();

        return response()->json(null, 204);
    }

    /** Gera um novo token de ingestão (invalida o anterior). */
    public function regenerarToken(Servidor $servidor): JsonResponse
    {
        $servidor->update(['tipo' => 'agente', 'token' => $this->novoToken()]);

        return response()->json($servidor);
    }

    private function novoToken(): string
    {
        do {
            $token = Str::random(48);
        } while (Servidor::where('token', $token)->exists());

        return $token;
    }

    private function validar(Request $request): array
    {
        return $request->validate([
            'nome'               => ['required', 'string', 'max:255'],
            'host'               => ['nullable', 'string', 'max:255'],
            'ambiente'           => ['nullable', 'string', 'max:60'],
            'tipo'               => ['required', Rule::in(['simulado', 'agente'])],
            'so'                 => ['nullable', 'string', 'max:120'],
            'cpu_nucleos'        => ['nullable', 'integer', 'min:1', 'max:1024'],
            'memoria_total_mb'   => ['nullable', 'integer', 'min:1'],
            'disco_total_gb'     => ['nullable', 'integer', 'min:1'],
            'intervalo_segundos' => ['nullable', 'integer', 'min:1', 'max:300'],
            'limite_cpu'         => ['nullable', 'integer', 'min:1', 'max:100'],
            'limite_memoria'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'limite_disco'       => ['nullable', 'integer', 'min:1', 'max:100'],
            'ativo'              => ['nullable', 'boolean'],
        ]);
    }
}
