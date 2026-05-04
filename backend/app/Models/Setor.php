<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Setor extends Model
{
    use HasFactory;

    protected $table = 'setores';

    protected $fillable = [
        'nome',
        'descricao',
    ];

    public function processos(): HasMany
    {
        return $this->hasMany(Processo::class);
    }

    public function campos(): HasMany
    {
        return $this->hasMany(CampoPersonalizado::class)->orderBy('ordem');
    }


    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'setor_user');
    }
}
