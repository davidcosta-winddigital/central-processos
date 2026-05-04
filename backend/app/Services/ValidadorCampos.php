<?php

namespace App\Services;

use App\Models\CampoPersonalizado;

/**
 * Validador server-side para valores enviados nos processos.
 * Espelha o que o front faz em regras.js — defesa em profundidade.
 */
class ValidadorCampos
{
    /**
     * @param array $valoresPorCampoId  [campo_id => valor]
     * @param iterable<CampoPersonalizado> $campos
     * @return array  ['campo_id' => 'mensagem de erro']  vazio se tudo ok
     */
    public function validar(array $valoresPorCampoId, iterable $campos): array
    {
        $mapaPorId = [];
        $mapaPorNome = [];
        foreach ($campos as $c) {
            $mapaPorId[$c->id] = $c;
            $mapaPorNome[$c->nome] = $c;
        }

        $erros = [];
        foreach ($mapaPorId as $id => $campo) {
            $valor = $valoresPorCampoId[$id] ?? null;

            // Avalia condicional: se invisível, ignora obrigatoriedade.
            if (! $this->avaliarCondicional($campo, $valoresPorCampoId, $mapaPorNome)) {
                continue;
            }

            $erro = $this->validarValor($campo, $valor);
            if ($erro) {
                $erros[$id] = $erro;
            }
        }
        return $erros;
    }

    private function avaliarCondicional(CampoPersonalizado $campo, array $valoresPorId, array $mapaPorNome): bool
    {
        $cond = $campo->regras['condicional'] ?? null;
        if (! $cond || empty($cond['regras'])) {
            return true;
        }

        $opLogico = strtolower($cond['operador_logico'] ?? 'and');
        $resultados = [];

        foreach ($cond['regras'] as $regra) {
            $alvo = $mapaPorNome[$regra['campo']] ?? null;
            if (! $alvo) { $resultados[] = true; continue; }

            $valorAtual = $valoresPorId[$alvo->id] ?? null;
            $resultados[] = $this->aplicarOperador($regra['operador'] ?? '=', $valorAtual, $regra['valor'] ?? null);
        }

        return $opLogico === 'or'
            ? in_array(true, $resultados, true)
            : ! in_array(false, $resultados, true);
    }

    private function aplicarOperador(string $op, $a, $b): bool
    {
        return match ($op) {
            '='          => (string) $a === (string) $b,
            '!='         => (string) $a !== (string) $b,
            '>'          => (float) $a >  (float) $b,
            '<'          => (float) $a <  (float) $b,
            '>='         => (float) $a >= (float) $b,
            '<='         => (float) $a <= (float) $b,
            'preenchido' => $a !== null && $a !== '' && ! (is_array($a) && empty($a)),
            'vazio'      => $a === null || $a === '' || (is_array($a) && empty($a)),
            'contem'     => is_array($a) ? in_array($b, $a, false) : str_contains((string) $a, (string) $b),
            default      => true,
        };
    }

    private function validarValor(CampoPersonalizado $campo, $valor): ?string
    {
        $regras = $campo->regras ?? [];
        $vazio = $valor === null || $valor === '' || (is_array($valor) && empty($valor));

        if ($campo->obrigatorio && $vazio) {
            return "Campo '{$campo->rotulo}' é obrigatório.";
        }
        if ($vazio) return null;

        $valorStr = is_array($valor) ? json_encode($valor) : (string) $valor;

        switch ($campo->tipo) {
            case 'cpf':
                if (! $this->validarCPF($valorStr)) return 'CPF inválido.';
                break;
            case 'cnpj':
                if (! $this->validarCNPJ($valorStr)) return 'CNPJ inválido.';
                break;
            case 'email':
                if (! filter_var($valorStr, FILTER_VALIDATE_EMAIL)) return 'E-mail inválido.';
                break;
            case 'url':
                if (! filter_var($valorStr, FILTER_VALIDATE_URL)) return 'URL inválida.';
                break;
            case 'cep':
                if (! preg_match('/^\d{5}-?\d{3}$/', $valorStr)) return 'CEP inválido.';
                break;
            case 'numero':
            case 'moeda':
            case 'percentual':
                if (! is_numeric($valorStr)) return 'Número inválido.';
                $n = (float) $valorStr;
                if (isset($regras['min']) && $n < (float) $regras['min']) return 'Valor abaixo do mínimo.';
                if (isset($regras['max']) && $n > (float) $regras['max']) return 'Valor acima do máximo.';
                break;
        }

        if (isset($regras['tamanho_max']) && mb_strlen($valorStr) > (int) $regras['tamanho_max']) {
            return "Limite de {$regras['tamanho_max']} caracteres.";
        }

        if (! empty($regras['validacao']['regex'])) {
            $delim = '/' . str_replace('/', '\/', $regras['validacao']['regex']) . '/u';
            if (@preg_match($delim, $valorStr) === 0) {
                return $regras['validacao']['mensagem'] ?? 'Formato inválido.';
            }
        }

        return null;
    }

    private function validarCPF(string $cpf): bool
    {
        $cpf = preg_replace('/\D/', '', $cpf);
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1+$/', $cpf)) return false;
        for ($t = 9; $t < 11; $t++) {
            $d = 0;
            for ($c = 0; $c < $t; $c++) $d += $cpf[$c] * (($t + 1) - $c);
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) return false;
        }
        return true;
    }

    private function validarCNPJ(string $cnpj): bool
    {
        $cnpj = preg_replace('/\D/', '', $cnpj);
        if (strlen($cnpj) !== 14 || preg_match('/^(\d)\1+$/', $cnpj)) return false;
        $calc = function ($base) {
            $soma = 0;
            $pos = strlen($base) - 7;
            for ($i = strlen($base); $i >= 1; $i--) {
                $soma += $base[strlen($base) - $i] * $pos--;
                if ($pos < 2) $pos = 9;
            }
            $r = $soma % 11;
            return $r < 2 ? 0 : 11 - $r;
        };
        if ($calc(substr($cnpj, 0, 12)) != $cnpj[12]) return false;
        if ($calc(substr($cnpj, 0, 13)) != $cnpj[13]) return false;
        return true;
    }
}
