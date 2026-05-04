<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const PAPEIS = ['viewer', 'editor', 'manager', 'admin'];

    protected $fillable = ['name', 'email', 'password', 'role', 'avatar_path', 'cargo', 'telefone'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = ['password' => 'hashed'];

    protected $appends = ['avatar_url'];

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar_path) return null;
        // Se já é URL absoluta (futuro suporte a S3, etc), retorna como está.
        if (preg_match('/^https?:\/\//', $this->avatar_path)) {
            return $this->avatar_path;
        }
        return url('storage/' . ltrim($this->avatar_path, '/'));
    }

    public function setores(): BelongsToMany
    {
        return $this->belongsToMany(Setor::class, 'setor_user')
            ->withPivot('papel');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function hasSetorAccess(Setor $setor): bool
    {
        if ($this->isAdmin()) {
            return true;
        }
        return $this->setores()->where('setores.id', $setor->id)->exists();
    }

    /**
     * Retorna o papel do usuário em um setor (ou null se não for membro).
     * Admin global sempre devolve 'admin'.
     */
    public function papelEm(Setor $setor): ?string
    {
        if ($this->isAdmin()) {
            return 'admin';
        }

        $row = $this->setores()->where('setores.id', $setor->id)->first();
        return $row?->pivot?->papel;
    }

    /**
     * Compara hierarquia de papéis. Maior = mais permissões.
     */
    public function papelTemNivelMinimo(Setor $setor, string $minimo): bool
    {
        $hierarquia = ['viewer' => 1, 'editor' => 2, 'manager' => 3, 'admin' => 4];
        $papel = $this->papelEm($setor);
        if (! $papel) {
            return false;
        }
        return ($hierarquia[$papel] ?? 0) >= ($hierarquia[$minimo] ?? 99);
    }
}
