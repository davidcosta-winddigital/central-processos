<?php

namespace App\Policies;

use App\Models\CampoPersonalizado;
use App\Models\Setor;
use App\Models\User;

class CampoPersonalizadoPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user, Setor $setor): bool
    {
        return $user->hasSetorAccess($setor);
    }

    public function view(User $user, CampoPersonalizado $campo): bool
    {
        return $user->hasSetorAccess($campo->setor);
    }

    /**
     * Apenas admin global pode gerir definições de campos.
     * Mantido restrito conforme decisão do produto.
     */
    public function manage(User $user, Setor $setor): bool
    {
        return false;
    }
}
