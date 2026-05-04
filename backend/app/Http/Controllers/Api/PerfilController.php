<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class PerfilController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->payload($request->user()));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name'     => ['sometimes', 'required', 'string', 'max:255'],
            'email'    => ['sometimes', 'required', 'email', 'unique:users,email,' . $user->id],
            'cargo'    => ['nullable', 'string', 'max:120'],
            'telefone' => ['nullable', 'string', 'max:32'],
            'senha_atual'  => ['required_with:nova_senha', 'string'],
            'nova_senha'   => ['nullable', 'string', 'min:6', 'confirmed'],
        ]);

        if (! empty($data['nova_senha'])) {
            if (! Hash::check($data['senha_atual'], $user->password)) {
                abort(422, 'Senha atual incorreta.');
            }
            $user->password = Hash::make($data['nova_senha']);
        }

        $user->fill(array_intersect_key($data, array_flip(['name', 'email', 'cargo', 'telefone'])));
        $user->save();

        return response()->json($this->payload($user->fresh()));
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
        ]);

        $user = $request->user();

        // Remove avatar antigo
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store("avatars/{$user->id}", 'public');
        $user->avatar_path = $path;
        $user->save();

        return response()->json($this->payload($user->fresh()));
    }

    public function removerAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }
        $user->avatar_path = null;
        $user->save();

        return response()->json($this->payload($user->fresh()));
    }

    private function payload($user): array
    {
        $setores = $user->setores()->get()->map(fn ($s) => [
            'id'    => $s->id,
            'nome'  => $s->nome,
            'papel' => $s->pivot->papel,
        ]);

        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'cargo'      => $user->cargo,
            'telefone'   => $user->telefone,
            'avatar_url' => $user->avatar_url,
            'is_admin'   => $user->isAdmin(),
            'setores'    => $setores,
            'setor_ids'  => $user->isAdmin() ? null : $setores->pluck('id'),
        ];
    }
}
