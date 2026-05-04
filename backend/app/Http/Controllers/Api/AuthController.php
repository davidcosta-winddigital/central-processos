<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $email = $request->input('email', 'usuario@local');

        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $email, 'password' => '', 'role' => 'admin']
        );

        // Apaga tokens anteriores para evitar acúmulo na tabela
        $user->tokens()->delete();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userPayload($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Desconectado.']);
    }

    private function userPayload(User $user): array
    {
        $setores = $user->setores()->get()->map(function ($s) {
            return [
                'id'    => $s->id,
                'nome'  => $s->nome,
                'papel' => $s->pivot->papel,
            ];
        });

        return [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'role'      => $user->role,
            'cargo'     => $user->cargo,
            'telefone'  => $user->telefone,
            'avatar_url'=> $user->avatar_url,
            'is_admin'  => $user->isAdmin(),
            'setores'   => $setores,
            'setor_ids' => $user->isAdmin() ? null : $setores->pluck('id'),
        ];
    }
}
