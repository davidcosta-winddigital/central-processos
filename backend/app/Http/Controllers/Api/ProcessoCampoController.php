<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Processo;
use App\Models\ProcessoCampo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ProcessoCampoController extends Controller
{
    public function index(Processo $processo): JsonResponse
    {
        return response()->json($processo->processoCampos()->get());
    }

    public function store(Request $request, Processo $processo): JsonResponse
    {
        $data = $this->validateCampo($request);

        $campo = $processo->processoCampos()->create($data);

        return response()->json($campo, 201);
    }

    public function update(Request $request, ProcessoCampo $campo): JsonResponse
    {
        $data = $this->validateCampo($request, partial: true);

        $campo->update($data);

        return response()->json($campo->fresh());
    }

    public function destroy(ProcessoCampo $campo): JsonResponse
    {
        $campo->delete();

        return response()->json(null, 204);
    }

    private function validateCampo(Request $request, bool $partial = false): array
    {
        $req  = $partial ? 'sometimes' : 'required';
        $data = $request->validate([
            'nome'       => [$req, 'string', 'regex:/^[a-zA-Z][a-zA-Z0-9_]*$/'],
            'rotulo'     => [$req, 'string', 'max:255'],
            'tipo'       => [$req, 'in:texto,numero,data,selecao'],
            'opcoes'     => 'nullable|array',
            'opcoes.*'   => 'string',
            'obrigatorio'=> 'boolean',
            'ordem'      => 'integer|min:0',
            'valor'      => 'nullable|string',
        ]);

        $tipo = $data['tipo'] ?? null;
        if ($tipo === 'selecao' && empty($data['opcoes'])) {
            throw ValidationException::withMessages([
                'opcoes' => 'Campos de seleção exigem pelo menos uma opção.',
            ]);
        }

        return $data;
    }
}
