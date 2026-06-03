<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Servidor extends Model
{
    protected $table = 'servidores';

    public function observacoes(): HasMany
    {
        return $this->hasMany(ServidorObservacao::class)->latest();
    }


    protected $fillable = [
        'nome', 'host', 'ambiente', 'tipo', 'token', 'so',
        'cpu_nucleos', 'memoria_total_mb', 'disco_total_gb', 'intervalo_segundos',
        'limite_cpu', 'limite_memoria', 'limite_disco', 'ativo',
    ];

    protected $casts = [
        'cpu_nucleos'        => 'integer',
        'memoria_total_mb'   => 'integer',
        'disco_total_gb'     => 'integer',
        'intervalo_segundos' => 'integer',
        'limite_cpu'         => 'integer',
        'limite_memoria'     => 'integer',
        'limite_disco'       => 'integer',
        'ativo'              => 'boolean',
    ];
}
