<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CampoPersonalizado;
use App\Models\Processo;
use App\Models\Setor;
use App\Models\ValorCampo;
use App\Services\ValidadorCampos;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProcessoController extends Controller
{
    public function index(Request $request, Setor $setor): JsonResponse
    {
        $this->authorize('viewSetor', [Processo::class, $setor]);

        $processos = $setor->processos()
            ->withCount('etapas')
            ->orderBy('titulo')
            ->get();

        return response()->json($processos);
    }

    public function store(Request $request, Setor $setor): JsonResponse
    {
        $this->authorize('create', [Processo::class, $setor]);

        $data = $request->validate([
            'titulo'                           => ['required', 'string', 'max:255'],
            'descricao'                        => ['nullable', 'string'],
            'etapas'                           => ['nullable', 'array'],
            'etapas.*.titulo'                  => ['required_with:etapas', 'string', 'max:255'],
            'etapas.*.descricao'               => ['nullable', 'string'],
            'valores'                          => ['nullable', 'array'],
            'valores.*.campo_personalizado_id' => ['required_with:valores', 'integer', 'exists:campos_personalizados,id'],
            'valores.*.valor'                  => ['nullable'],
        ]);

        $this->validarValoresObrigatorios($setor, $data['valores'] ?? []);

        $processo = DB::transaction(function () use ($setor, $data) {
            $processo = $setor->processos()->create([
                'titulo'    => $data['titulo'],
                'descricao' => $data['descricao'] ?? null,
            ]);

            foreach ($data['etapas'] ?? [] as $i => $etapa) {
                $processo->etapas()->create([
                    'titulo'    => $etapa['titulo'],
                    'descricao' => $etapa['descricao'] ?? null,
                    'ordem'     => $i,
                ]);
            }

            $this->sincronizarValores($processo, $data['valores'] ?? []);

            return $processo;
        });

        return response()->json($processo->load(['etapas', 'valores.campo', 'setor']), 201);
    }

    public function show(Request $request, Processo $processo): JsonResponse
    {
        $this->authorize('view', $processo);
        $user = $request->user();

        $processo->load([
            'etapas.anexos',
            'valores.campo.permissoes',
            'setor.campos.permissoes',
            'processoCampos',
        ]);

        $papel = $user->papelEm($processo->setor) ?? 'admin';
        $arr = $processo->toArray();

        if (! $user->isAdmin()) {
            $arr['valores'] = collect($processo->valores)
                ->filter(function ($valor) use ($papel) {
                    if (! $valor->campo) return true;
                    return $valor->campo->permissaoPara($papel)['pode_ver'];
                })
                ->values()
                ->map(function ($valor) use ($papel) {
                    $perm = $valor->campo->permissaoPara($papel);
                    $v = $valor->toArray();
                    $v['campo']['pode_editar'] = $perm['pode_editar'];
                    return $v;
                })
                ->all();

            if (isset($arr['setor']['campos'])) {
                $arr['setor']['campos'] = collect($arr['setor']['campos'])
                    ->filter(function ($c) use ($processo, $papel) {
                        $campo = collect($processo->setor->campos)->firstWhere('id', $c['id']);
                        return $campo ? $campo->permissaoPara($papel)['pode_ver'] : true;
                    })
                    ->map(function ($c) use ($processo, $papel) {
                        $campo = collect($processo->setor->campos)->firstWhere('id', $c['id']);
                        $c['pode_editar'] = $campo ? $campo->permissaoPara($papel)['pode_editar'] : true;
                        return $c;
                    })
                    ->values()
                    ->all();
            }
        }

        $arr['permissoes'] = [
            'editar'  => $user->papelTemNivelMinimo($processo->setor, 'editor'),
            'excluir' => $user->papelTemNivelMinimo($processo->setor, 'manager'),
        ];

        return response()->json($arr);
    }

    public function update(Request $request, Processo $processo): JsonResponse
    {
        $this->authorize('update', $processo);

        $data = $request->validate([
            'titulo'                           => ['sometimes', 'required', 'string', 'max:255'],
            'descricao'                        => ['nullable', 'string'],
            'valores'                          => ['nullable', 'array'],
            'valores.*.campo_personalizado_id' => ['required_with:valores', 'integer', 'exists:campos_personalizados,id'],
            'valores.*.valor'                  => ['nullable'],
        ]);

        if (array_key_exists('valores', $data)) {
            $this->validarValoresObrigatorios($processo->setor, $data['valores']);
        }

        DB::transaction(function () use ($processo, $data) {
            $processo->update(array_filter([
                'titulo'    => $data['titulo'] ?? null,
                'descricao' => $data['descricao'] ?? null,
            ], fn ($v) => ! is_null($v)));

            if (isset($data['valores'])) {
                $this->sincronizarValores($processo, $data['valores']);
            }
        });

        return response()->json($processo->fresh(['etapas', 'valores.campo', 'processoCampos']));
    }

    public function destroy(Request $request, Processo $processo): JsonResponse
    {
        $this->authorize('delete', $processo);

        $processo->delete();

        return response()->json(null, 204);
    }

    private function validarValoresObrigatorios(Setor $setor, array $valores): void
    {
        $campos = $setor->campos()->whereNull('template_id')->get();

        $valoresPorId = [];
        foreach ($valores as $item) {
            $valoresPorId[(int) $item['campo_personalizado_id']] = $item['valor'] ?? null;
        }

        $erros = (new ValidadorCampos())->validar($valoresPorId, $campos);

        if (! empty($erros)) {
            abort(response()->json([
                'message' => 'Campos com erros de validação.',
                'errors'  => $erros,
            ], 422));
        }
    }

    private function sincronizarValores(Processo $processo, array $valores): void
    {
        $camposValidos = CampoPersonalizado::where('setor_id', $processo->setor_id)
            ->whereNull('template_id')
            ->pluck('id')
            ->all();

        foreach ($valores as $item) {
            if (! in_array($item['campo_personalizado_id'], $camposValidos, true)) {
                continue;
            }

            $valorBruto = $item['valor'] ?? null;
            if (is_array($valorBruto) || is_object($valorBruto)) {
                $valorBruto = json_encode($valorBruto, JSON_UNESCAPED_UNICODE);
            }

            ValorCampo::updateOrCreate(
                ['processo_id' => $processo->id, 'campo_personalizado_id' => $item['campo_personalizado_id']],
                ['valor' => $valorBruto !== null ? (string) $valorBruto : null]
            );
        }
    }
}
