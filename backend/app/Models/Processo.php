<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ProcessoAnexo;

class Processo extends Model
{
    use HasFactory;

    protected $table = 'processos';

    protected $fillable = [
        'setor_id',
        'template_id',
        'titulo',
        'descricao',
    ];

    public function setor(): BelongsTo
    {
        return $this->belongsTo(Setor::class);
    }

    public function etapas(): HasMany
    {
        return $this->hasMany(Etapa::class)->orderBy('ordem');
    }

    public function valores(): HasMany
    {
        return $this->hasMany(ValorCampo::class);
    }

    public function processoCampos(): HasMany
    {
        return $this->hasMany(ProcessoCampo::class)->orderBy('ordem');
    }

    public function anexos(): HasMany
    {
        return $this->hasMany(ProcessoAnexo::class);
    }
}
