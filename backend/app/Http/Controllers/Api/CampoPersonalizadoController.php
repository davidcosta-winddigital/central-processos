<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CampoPersonalizado;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CampoPersonalizadoController extends Controller
{
    public function index(Request $request, Setor $setor): JsonResponse
    {
        return response()->json($setor->campos()->whereNull('template_id')->orderBy('ordem')->get());
    }

    public function store(Request $request, Setor $setor): JsonResponse
    {
        $data = $this->validateCampo($request, $setor->id);
        $data['setor_id'] = $setor->id;

        $campo = CampoPersonalizado::create($data);

        return response()->json($campo, 201);
    }

    public function show(CampoPersonalizado $campo): JsonResponse
    {
        return response()->json($campo);
    }

    public function update(Request $request, CampoPersonalizado $campo): JsonResponse
    {
        $data = $this->validateCampo($request, $campo->setor_id, $campo->id, true);

        $campo->update($data);

        return response()->json($campo);
    }

    public function destroy(CampoPersonalizado $campo): JsonResponse
    {
        $campo->delete();

        return response()->json(null, 204);
    }

    private function validateCampo(Request $request, int $setorId, ?int $campoId = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        $rules = [
            'nome' => [
                $required,
                'string',
                'max:100',
                'regex:/^[a-zA-Z][a-zA-Z0-9_]*$/',
                Rule::unique('campos_personalizados', 'nome')
                    ->where(function ($q) use ($setorId) {
                        $q->where('setor_id', $setorId)->whereNull('template_id');
                    })
                    ->ignore($campoId),
            ],
            'rotulo'      => [$required, 'string', 'max:255'],
            'secao'       => ['nullable', 'string', 'max:120'],
            'coluna'      => ['nullable', 'integer', 'min:1', 'max:2'],
            'ajuda'       => ['nullable', 'string', 'max:500'],
            'tipo'        => [$required, Rule::in(CampoPersonalizado::TIPOS)],
            'opcoes'      => ['nullable', 'array'],
            'opcoes.*'    => ['string', 'max:255'],
            'regras'      => ['nullable', 'array'],
            'obrigatorio' => ['nullable', 'boolean'],
            'ordem'       => ['nullable', 'integer', 'min:0'],
        ];

        $data = $request->validate($rules);

        $tiposComOpcoes = ['selecao', 'multi_selecao', 'radio'];

        if (in_array($data['tipo'] ?? null, $tiposComOpcoes, true) && empty($data['opcoes'])) {
            abort(422, 'Campos do tipo seleção precisam de pelo menos uma opção.');
        }

        if (! in_array($data['tipo'] ?? null, $tiposComOpcoes, true)) {
            $data['opcoes'] = null;
        }

        // Garante que template_id seja null (templates removidos do produto).
        $data['template_id'] = null;

        return $data;
    }
}
