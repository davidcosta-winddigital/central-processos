<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServidorObservacao extends Model
{
    protected $table = 'servidor_observacoes';

    protected $fillable = ['servidor_id', 'user_id', 'autor', 'texto'];

    public function servidor(): BelongsTo
    {
        return $this->belongsTo(Servidor::class);
    }
}
