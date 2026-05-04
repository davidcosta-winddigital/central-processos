<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Etapa extends Model
{
    use HasFactory;

    protected $table = 'etapas';

    protected $fillable = [
        'processo_id',
        'titulo',
        'descricao',
        'ordem',
    ];

    protected $casts = [
        'ordem' => 'integer',
    ];

    public function processo(): BelongsTo
    {
        return $this->belongsTo(Processo::class);
    }

    public function anexos(): HasMany
    {
        return $this->hasMany(EtapaAnexo::class)->orderByDesc('created_at');
    }
}
