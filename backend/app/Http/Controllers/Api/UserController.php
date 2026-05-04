<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::with('setores:id,nome')
            ->orderBy('name')
            ->get()
            ->map(function ($u) {
                return [
                    'id'         => $u->id,
                    'name'       => $u->name,
                    'email'      => $u->email,
                    'role'       => $u->role,
                    'setores'    => $u->setores->map(function ($s) {
                        return [
                            'id'    => $s->id,
                            'nome'  => $s->nome,
                            'papel' => $s->pivot->papel,
                        ];
                    }),
                    'created_at' => $u->created_at,
                ];
            });

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                 => 'required|string|max:255',
            'email'                => 'required|email|unique:users,email',
            'password'             => 'required|string|min:6',
            'role'                 => 'required|in:admin,user',
            'setores'              => 'array',
            'setores.*.setor_id'   => 'required_with:setores|integer|exists:setores,id',
            'setores.*.papel'      => ['required_with:setores', Rule::in(User::PAPEIS)],
        ]);

        $setoresPayload = $data['setores'] ?? [];
        unset($data['setores']);

        $data['password'] = bcrypt($data['password']);

        $user = User::create($data);

        // Vincula setores apenas se não for admin global (admin tem acesso a todos).
        if ($user->role !== 'admin' && ! empty($setoresPayload)) {
            $sync = collect($setoresPayload)
                ->mapWithKeys(fn ($item) => [(int) $item['setor_id'] => ['papel' => $item['papel']]])
                ->all();
            $user->setores()->sync($sync);
        }

        return response()->json($user->load('setores'), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'                 => 'sometimes|string|max:255',
            'email'                => 'sometimes|email|unique:users,email,' . $user->id,
            'password'             => 'sometimes|string|min:6',
            'role'                 => 'sometimes|in:admin,user',
            'setores'              => 'sometimes|array',
            'setores.*.setor_id'   => 'required_with:setores|integer|exists:setores,id',
            'setores.*.papel'      => ['required_with:setores', Rule::in(User::PAPEIS)],
        ]);

        $setoresPayload = $data['setores'] ?? null;
        unset($data['setores']);

        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }

        $user->update($data);

        if ($setoresPayload !== null) {
            if ($user->role === 'admin') {
                // Admin global ignora vínculos por setor.
                $user->setores()->sync([]);
            } else {
                $sync = collect($setoresPayload)
                    ->mapWithKeys(fn ($item) => [(int) $item['setor_id'] => ['papel' => $item['papel']]])
                    ->all();
                $user->setores()->sync($sync);
            }
        }

        return response()->json($user->load('setores'));
    }

    public function destroy(User $user): JsonResponse
    {
        abort_if($user->id === request()->user()->id, 422, 'Não é possível excluir o próprio usuário.');

        $user->delete();

        return response()->json(null, 204);
    }

    /**
     * Atualiza setores e papéis do usuário.
     * Aceita formato novo: { setores: [{ setor_id, papel }] }
     * Aceita formato legado: { setor_ids: [ids] } (papel default = viewer)
     */
    public function updateSetores(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'setores'              => 'array',
            'setores.*.setor_id'   => 'required_with:setores|integer|exists:setores,id',
            'setores.*.papel'      => ['required_with:setores', Rule::in(User::PAPEIS)],
            'setor_ids'            => 'array',
            'setor_ids.*'          => 'integer|exists:setores,id',
        ]);

        if ($request->filled('setores')) {
            $sync = collect($request->input('setores'))
                ->mapWithKeys(function ($item) {
                    return [(int) $item['setor_id'] => ['papel' => $item['papel']]];
                })
                ->all();
            $user->setores()->sync($sync);
        } else {
            $sync = collect($request->input('setor_ids', []))
                ->mapWithKeys(function ($id) { return [(int) $id => ['papel' => 'viewer']]; })
                ->all();
            $user->setores()->sync($sync);
        }

        return response()->json(['message' => 'Permissões atualizadas.']);
    }
}
