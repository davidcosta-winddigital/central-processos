<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValorCampo extends Model
{
    use HasFactory;

    protected $table = 'valores_campos';

    protected $fillable = [
        'processo_id',
        'campo_personalizado_id',
        'valor',
    ];

    public function processo(): BelongsTo
    {
        return $this->belongsTo(Processo::class);
    }

    public function campo(): BelongsTo
    {
        return $this->belongsTo(CampoPersonalizado::class, 'campo_personalizado_id');
    }
}
