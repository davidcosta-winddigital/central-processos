<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistroVerificacao extends Model
{
    protected $table = 'registro_verificacoes';

    protected $fillable = ['name', 'email', 'password', 'codigo', 'tentativas', 'expira_em'];

    protected $hidden = ['password', 'codigo'];

    protected $casts = [
        'expira_em'  => 'datetime',
        'tentativas' => 'integer',
    ];

    public function expirado(): bool
    {
        return $this->expira_em->isPast();
    }
}
