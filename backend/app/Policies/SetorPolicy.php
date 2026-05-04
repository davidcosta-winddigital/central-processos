<?php

namespace App\Policies;

use App\Models\Setor;
use App\Models\User;

class SetorPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Setor $setor): bool
    {
        return $user->hasSetorAccess($setor);
    }

    public function create(User $user): bool
    {
        return false; // só admin global, tratado no before()
    }

    public function update(User $user, Setor $setor): bool
    {
        return false;
    }

    public function delete(User $user, Setor $setor): bool
    {
        return false;
    }
}
