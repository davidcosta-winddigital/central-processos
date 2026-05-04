<?php

namespace App\Providers;

use App\Models\CampoPersonalizado;
use App\Models\Etapa;
use App\Models\Processo;
use App\Models\Setor;
use App\Policies\CampoPersonalizadoPolicy;
use App\Policies\EtapaPolicy;
use App\Policies\ProcessoPolicy;
use App\Policies\SetorPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Setor::class               => SetorPolicy::class,
        Processo::class            => ProcessoPolicy::class,
        CampoPersonalizado::class  => CampoPersonalizadoPolicy::class,
        Etapa::class               => EtapaPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
