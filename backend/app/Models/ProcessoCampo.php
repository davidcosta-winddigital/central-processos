<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProcessoCampo extends Model
{
    use HasFactory;

    protected $table = 'processo_campos';

    protected $fillable = [
        'processo_id',
        'nome',
        'rotulo',
        'tipo',
        'opcoes',
        'obrigatorio',
        'ordem',
        'valor',
    ];

    protected $casts = [
        'opcoes'      => 'array',
        'obrigatorio' => 'boolean',
        'ordem'       => 'integer',
    ];

    public const TIPOS = ['texto', 'numero', 'data', 'selecao'];

    public function processo(): BelongsTo
    {
        return $this->belongsTo(Processo::class);
    }
}
