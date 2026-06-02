<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\CodigoVerificacaoMail;
use App\Models\RegistroVerificacao;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login com e-mail + senha (Sanctum token).
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! $user->password || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['E-mail ou senha inválidos.'],
            ]);
        }

        // Apaga tokens anteriores para evitar acúmulo na tabela
        $user->tokens()->delete();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userPayload($user),
        ]);
    }

    /**
     * Etapa 1 do cadastro: valida domínio + dados, gera código e envia por e-mail.
     * O usuário só é criado de fato na etapa de verificação.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email'),
                fn ($attr, $value, $fail) => $this->validarDominio($value, $fail),
            ],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [], ['name' => 'nome', 'password' => 'senha']);

        $minutos = config('auth.registro.codigo_validade_minutos', 15);
        $codigo  = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        RegistroVerificacao::updateOrCreate(
            ['email' => $data['email']],
            [
                'name'       => $data['name'],
                'password'   => Hash::make($data['password']),
                'codigo'     => Hash::make($codigo),
                'tentativas' => 0,
                'expira_em'  => now()->addMinutes($minutos),
            ]
        );

        Mail::to($data['email'])->send(new CodigoVerificacaoMail($data['name'], $codigo, $minutos));

        return response()->json([
            'message' => "Enviamos um código de verificação para {$data['email']}.",
            'email'   => $data['email'],
        ]);
    }

    /**
     * Etapa 2 do cadastro: valida o código e cria a conta (login automático).
     */
    public function registerVerify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'  => ['required', 'email'],
            'codigo' => ['required', 'string'],
        ], [], ['codigo' => 'código']);

        $registro = RegistroVerificacao::where('email', $data['email'])->first();

        if (! $registro) {
            throw ValidationException::withMessages([
                'codigo' => ['Nenhum cadastro pendente para este e-mail. Inicie o cadastro novamente.'],
            ]);
        }

        if ($registro->expirado()) {
            $registro->delete();
            throw ValidationException::withMessages([
                'codigo' => ['O código expirou. Inicie o cadastro novamente.'],
            ]);
        }

        $maxTentativas = config('auth.registro.max_tentativas', 5);
        if ($registro->tentativas >= $maxTentativas) {
            $registro->delete();
            throw ValidationException::withMessages([
                'codigo' => ['Número máximo de tentativas excedido. Inicie o cadastro novamente.'],
            ]);
        }

        if (! Hash::check($data['codigo'], $registro->codigo)) {
            $registro->increment('tentativas');
            $restantes = $maxTentativas - $registro->tentativas;
            throw ValidationException::withMessages([
                'codigo' => ["Código inválido. Tentativas restantes: {$restantes}."],
            ]);
        }

        // Código correto → cria o usuário com o hash de senha já gerado na etapa 1.
        $user = User::create([
            'name'     => $registro->name,
            'email'    => $registro->email,
            'role'     => 'user',
            'password' => 'placeholder', // será sobrescrito abaixo pelo hash real
        ]);
        // Grava o hash original sem passar pelo cast 'hashed' (evita re-hash).
        DB::table('users')->where('id', $user->id)->update(['password' => $registro->password]);

        $registro->delete();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userPayload($user->fresh()),
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

    /**
     * Regra de validação: o domínio do e-mail precisa estar na lista permitida.
     */
    private function validarDominio(string $email, callable $fail): void
    {
        $dominios = config('auth.registro.dominios', []);
        $dominio  = strtolower(substr(strrchr($email, '@') ?: '', 1));

        if (! in_array($dominio, $dominios, true)) {
            $lista = implode(', ', array_map(fn ($d) => "@{$d}", $dominios));
            $fail("Apenas e-mails dos domínios {$lista} podem criar conta.");
        }
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
