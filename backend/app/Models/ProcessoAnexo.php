<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProcessoAnexo extends Model
{
    protected $table = 'processo_anexos';

    protected $fillable = [
        'processo_id',
        'nome_original',
        'caminho',
        'tipo_mime',
        'tamanho',
    ];

    protected $appends = ['url'];

    public function processo(): BelongsTo
    {
        return $this->belongsTo(Processo::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->caminho);
    }
}
