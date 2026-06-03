<?php

use Illuminate\Support\Facades\Broadcast;

/*
| Canal privado do dashboard de infraestrutura.
| Só recebe quem é admin E membro do setor de Tecnologia.
*/
Broadcast::channel('infra.servidores', function ($user) {
    return $user->temAcessoInfra();
});
