<?php

namespace App\Policies;

use App\Models\Processo;
use App\Models\Setor;
use App\Models\User;

class ProcessoPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function view(User $user, Processo $processo): bool
    {
        return $user->papelTemNivelMinimo($processo->setor, 'viewer');
    }

    public function viewSetor(User $user, Setor $setor): bool
    {
        return $user->papelTemNivelMinimo($setor, 'viewer');
    }

    public function create(User $user, Setor $setor): bool
    {
        return $user->papelTemNivelMinimo($setor, 'editor');
    }

    public function update(User $user, Processo $processo): bool
    {
        return $user->papelTemNivelMinimo($processo->setor, 'editor');
    }

    public function delete(User $user, Processo $processo): bool
    {
        return $user->papelTemNivelMinimo($processo->setor, 'manager');
    }

    public function approve(User $user, Processo $processo): bool
    {
        return $user->papelTemNivelMinimo($processo->setor, 'manager');
    }
}
