<?php

namespace App\Policies;

use App\Models\Etapa;
use App\Models\User;

class EtapaPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function view(User $user, Etapa $etapa): bool
    {
        return $user->papelTemNivelMinimo($etapa->processo->setor, 'viewer');
    }

    public function update(User $user, Etapa $etapa): bool
    {
        return $user->papelTemNivelMinimo($etapa->processo->setor, 'editor');
    }

    public function delete(User $user, Etapa $etapa): bool
    {
        return $user->papelTemNivelMinimo($etapa->processo->setor, 'manager');
    }
}
