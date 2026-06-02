<?php

return [

    'defaults' => [
        'guard'     => 'web',
        'passwords' => 'users',
    ],

    'guards' => [
        'web' => [
            'driver'   => 'session',
            'provider' => 'users',
        ],
        'api' => [
            'driver'   => 'token',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model'  => App\Models\User::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table'    => 'password_reset_tokens',
            'expire'   => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

    /*
    |--------------------------------------------------------------------------
    | Registro de novas contas
    |--------------------------------------------------------------------------
    | Domínios de e-mail autorizados a criar conta (auto-cadastro) e tempo de
    | validade do código de verificação enviado por e-mail.
    | Edite REGISTRO_DOMINIOS no .env (separados por vírgula) para liberar mais.
    */
    'registro' => [
        'dominios' => array_values(array_filter(array_map(
            fn ($d) => strtolower(trim($d)),
            explode(',', env('REGISTRO_DOMINIOS', 'winddigital.com.br,prolicitante.com.br'))
        ))),
        'codigo_validade_minutos' => (int) env('REGISTRO_CODIGO_MINUTOS', 15),
        'max_tentativas'          => (int) env('REGISTRO_MAX_TENTATIVAS', 5),
    ],

];
