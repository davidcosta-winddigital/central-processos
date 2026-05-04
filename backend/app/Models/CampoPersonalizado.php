<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CampoPersonalizado extends Model
{
    use HasFactory;

    protected $table = 'campos_personalizados';

    public const TIPOS = [
        'texto', 'texto_longo', 'rich_text',
        'numero', 'moeda', 'percentual',
        'data', 'datahora',
        'selecao', 'multi_selecao', 'radio',
        'booleano',
        'email', 'telefone', 'cpf', 'cnpj', 'cep', 'url',
        'arquivo', 'multi_arquivo',
        'usuario', 'multi_usuario',
        'assinatura',
    ];

    protected $fillable = [
        'setor_id',
        'template_id',
        'nome',
        'rotulo',
        'secao',
        'coluna',
        'ajuda',
        'tipo',
        'opcoes',
        'regras',
        'obrigatorio',
        'ordem',
    ];

    protected $casts = [
        'opcoes'      => 'array',
        'regras'      => 'array',
        'obrigatorio' => 'boolean',
        'ordem'       => 'integer',
        'coluna'      => 'integer',
    ];

    public function setor(): BelongsTo
    {
        return $this->belongsTo(Setor::class);
    }

    public function valores(): HasMany
    {
        return $this->hasMany(ValorCampo::class);
    }

    public function permissoes(): HasMany
    {
        return $this->hasMany(CampoPermissao::class);
    }

    /**
     * Resolve permissão (ver/editar) para um papel.
     * Sem registro → libera (default true).
     */
    public function permissaoPara(string $papel): array
    {
        $perm = $this->permissoes->firstWhere('papel', $papel);
        return [
            'pode_ver'    => $perm ? $perm->pode_ver : true,
            'pode_editar' => $perm ? $perm->pode_editar : true,
        ];
    }
}
