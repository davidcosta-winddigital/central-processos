<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CampoPermissaoController;
use App\Http\Controllers\Api\CampoPersonalizadoController;
use App\Http\Controllers\Api\EtapaAnexoController;
use App\Http\Controllers\Api\PerfilController;
use App\Http\Controllers\Api\EtapaController;
use App\Http\Controllers\Api\ProcessoAnexoController;
use App\Http\Controllers\Api\ProcessoCampoController;
use App\Http\Controllers\Api\ProcessoController;
use App\Http\Controllers\Api\SetorController;
use App\Http\Controllers\Api\SetorMetricasController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ── Públicas ──────────────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

// Cadastro de conta com verificação por código de e-mail (2 etapas)
Route::post('/auth/register',        [AuthController::class, 'register'])->middleware('throttle:6,1');
Route::post('/auth/register/verify', [AuthController::class, 'registerVerify'])->middleware('throttle:10,1');

// ── Autenticadas ──────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Perfil
    Route::get('/perfil',           [PerfilController::class, 'show']);
    Route::put('/perfil',           [PerfilController::class, 'update']);
    Route::post('/perfil/avatar',   [PerfilController::class, 'uploadAvatar']);
    Route::delete('/perfil/avatar', [PerfilController::class, 'removerAvatar']);

    Route::get('/', function () {
        return response()->json(['app' => config('app.name'), 'status' => 'ok']);
    });
    Route::get('/health', function () {
        return response()->json(['status' => 'ok']);
    });

    // Setores
    Route::apiResource('setores', SetorController::class)
        ->parameters(['setores' => 'setor']);
    Route::get('setores/{setor}/metricas', [SetorMetricasController::class, 'show']);

    // Campos personalizados do setor
    Route::apiResource('setores.campos', CampoPersonalizadoController::class)
        ->parameters(['setores' => 'setor', 'campos' => 'campo'])
        ->shallow();

    // Permissões por campo
    Route::get('campos/{campo}/permissoes', [CampoPermissaoController::class, 'index']);
    Route::put('campos/{campo}/permissoes', [CampoPermissaoController::class, 'update']);

    // Processos
    Route::apiResource('setores.processos', ProcessoController::class)
        ->parameters(['setores' => 'setor', 'processos' => 'processo'])
        ->shallow();

    // Etapas — apenas leitura/escrita estrutural (sem concluir/reabrir)
    Route::apiResource('processos.etapas', EtapaController::class)
        ->parameters(['processos' => 'processo', 'etapas' => 'etapa'])
        ->shallow();
    Route::get('etapas/{etapa}/anexos',   [EtapaAnexoController::class, 'index']);
    Route::post('etapas/{etapa}/anexos',  [EtapaAnexoController::class, 'store']);
    Route::delete('etapa-anexos/{anexo}', [EtapaAnexoController::class, 'destroy']);

    // Anexos do processo
    Route::get('processos/{processo}/anexos',  [ProcessoAnexoController::class, 'index']);
    Route::post('processos/{processo}/anexos', [ProcessoAnexoController::class, 'store']);
    Route::delete('anexos/{anexo}',            [ProcessoAnexoController::class, 'destroy']);

    // Campos específicos do processo
    Route::get('processos/{processo}/campos-processo', [ProcessoCampoController::class, 'index']);

    Route::middleware('isAdmin')->group(function () {
        // Gerenciamento de usuários
        Route::apiResource('users', UserController::class);
        Route::put('users/{user}/setores', [UserController::class, 'updateSetores']);

        // Campos do processo (escrita)
        Route::post('processos/{processo}/campos-processo', [ProcessoCampoController::class, 'store']);
        Route::put('campos-processo/{campo}',               [ProcessoCampoController::class, 'update']);
        Route::delete('campos-processo/{campo}',            [ProcessoCampoController::class, 'destroy']);
    });
});
