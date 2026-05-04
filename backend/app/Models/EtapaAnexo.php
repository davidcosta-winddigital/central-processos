<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class EtapaAnexo extends Model
{
    protected $table = 'etapa_anexos';

    protected $fillable = [
        'etapa_id',
        'nome_original',
        'caminho',
        'tipo_mime',
        'tamanho',
    ];

    protected $appends = ['url'];

    public function etapa(): BelongsTo
    {
        return $this->belongsTo(Etapa::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->caminho);
    }
}
