<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Processo;
use App\Models\ProcessoAnexo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProcessoAnexoController extends Controller
{
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    public function index(Request $request, Processo $processo): JsonResponse
    {
        abort_unless($request->user()->hasSetorAccess($processo->setor), 403, 'Sem acesso.');

        return response()->json(
            $processo->anexos()->orderBy('created_at', 'desc')->get()
        );
    }

    public function store(Request $request, Processo $processo): JsonResponse
    {
        abort_unless($request->user()->hasSetorAccess($processo->setor), 403, 'Sem acesso.');

        $request->validate([
            'arquivo' => ['required', 'file', 'max:20480'],
        ]);

        $arquivo = $request->file('arquivo');

        if (! in_array($arquivo->getMimeType(), self::ALLOWED_MIMES, true)) {
            abort(422, 'Tipo de arquivo não permitido. Use imagens (JPG, PNG, GIF, WebP), PDF ou Word (.doc, .docx).');
        }

        $extensao    = $arquivo->getClientOriginalExtension();
        $nomeArquivo = Str::uuid() . '.' . $extensao;
        $caminho     = 'anexos/' . $nomeArquivo;

        Storage::disk('public')->putFileAs('anexos', $arquivo, $nomeArquivo);

        $anexo = $processo->anexos()->create([
            'nome_original' => $arquivo->getClientOriginalName(),
            'caminho'       => $caminho,
            'tipo_mime'     => $arquivo->getMimeType(),
            'tamanho'       => $arquivo->getSize(),
        ]);

        return response()->json($anexo, 201);
    }

    public function destroy(Request $request, ProcessoAnexo $anexo): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Apenas administradores podem remover anexos.');

        Storage::disk('public')->delete($anexo->caminho);
        $anexo->delete();

        return response()->json(null, 204);
    }
}
