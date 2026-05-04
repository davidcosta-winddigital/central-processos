<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampoPermissao extends Model
{
    use HasFactory;

    protected $table = 'campo_permissoes';

    protected $fillable = [
        'campo_personalizado_id', 'papel', 'pode_ver', 'pode_editar',
    ];

    protected $casts = [
        'pode_ver'    => 'boolean',
        'pode_editar' => 'boolean',
    ];

    public function campo(): BelongsTo
    {
        return $this->belongsTo(CampoPersonalizado::class, 'campo_personalizado_id');
    }
}
