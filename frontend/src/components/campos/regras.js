// Avaliação de regras dinâmicas (condicionais e validação).
// O JSON `regras` em campo segue o formato:
// {
//   "validacao": { "regex": "...", "mensagem": "..." },
//   "tamanho_max": 255,
//   "min": 0, "max": 100,
//   "mascara": "999.999.999-99",
//   "valor_padrao": "...",
//   "condicional": {
//     "operador_logico": "and" | "or",  // padrão: "and"
//     "regras": [
//       { "campo": "tipo_contrato", "operador": "=", "valor": "CLT" }
//     ]
//   }
// }

import { validarCNPJ, validarCPF } from './mascaras.js';

const OPERADORES = {
  '=':  (a, b) => String(a ?? '') === String(b ?? ''),
  '!=': (a, b) => String(a ?? '') !== String(b ?? ''),
  '>':  (a, b) => Number(a) > Number(b),
  '<':  (a, b) => Number(a) < Number(b),
  '>=': (a, b) => Number(a) >= Number(b),
  '<=': (a, b) => Number(a) <= Number(b),
  'contem':       (a, b) => Array.isArray(a) ? a.includes(b) : String(a ?? '').includes(String(b ?? '')),
  'preenchido':   a => a != null && a !== '' && !(Array.isArray(a) && a.length === 0),
  'vazio':        a => a == null || a === '' || (Array.isArray(a) && a.length === 0),
};

/**
 * Retorna true se o campo deve ser visível dado o estado atual do form.
 * Sem condicional configurada → sempre visível.
 *
 * `todosValores` é um mapa { campoId: valor }.
 * Como condicionais usam o nome técnico do campo, recebemos opcionalmente
 * `mapaCamposPorNome` para resolver. Caso ausente, tentamos pelos próprios IDs.
 */
export function avaliarCondicional(campo, todosValores = {}, mapaCamposPorNome = null) {
  const cond = campo?.regras?.condicional;
  if (!cond || !Array.isArray(cond.regras) || cond.regras.length === 0) {
    return true;
  }

  const op = (cond.operador_logico ?? 'and').toLowerCase();
  const resolverValor = nomeCampo => {
    if (mapaCamposPorNome && mapaCamposPorNome[nomeCampo]) {
      return todosValores[mapaCamposPorNome[nomeCampo]];
    }
    // Fallback: procura pelo próprio nome em todosValores (caso a página esteja
    // indexando por nome em vez de id).
    return todosValores[nomeCampo];
  };

  const resultados = cond.regras.map(r => {
    const valorAtual = resolverValor(r.campo);
    const fn = OPERADORES[r.operador];
    if (!fn) return true;
    if (r.operador === 'preenchido' || r.operador === 'vazio') return fn(valorAtual);
    return fn(valorAtual, r.valor);
  });

  return op === 'or'
    ? resultados.some(Boolean)
    : resultados.every(Boolean);
}

/**
 * Valida o valor do campo. Retorna string com mensagem de erro ou null se válido.
 */
export function validarCampo(campo, valor) {
  const regras = campo?.regras ?? {};
  const vazio = valor == null || valor === '' || (Array.isArray(valor) && valor.length === 0);

  if (campo.obrigatorio && vazio) {
    return 'Campo obrigatório.';
  }
  if (vazio) return null;

  // Validações nativas por tipo
  switch (campo.tipo) {
    case 'cpf':
      if (!validarCPF(valor)) return 'CPF inválido.';
      break;
    case 'cnpj':
      if (!validarCNPJ(valor)) return 'CNPJ inválido.';
      break;
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor))) return 'E-mail inválido.';
      break;
    case 'url':
      try { new URL(valor); } catch { return 'URL inválida.'; }
      break;
    case 'cep':
      if (!/^\d{5}-?\d{3}$/.test(String(valor))) return 'CEP inválido.';
      break;
    case 'numero':
    case 'moeda':
    case 'percentual': {
      const n = Number(valor);
      if (Number.isNaN(n)) return 'Número inválido.';
      if (regras.min != null && n < Number(regras.min)) return `Mínimo: ${regras.min}.`;
      if (regras.max != null && n > Number(regras.max)) return `Máximo: ${regras.max}.`;
      break;
    }
  }

  // Tamanho máximo de texto
  if (typeof valor === 'string' && regras.tamanho_max && valor.length > Number(regras.tamanho_max)) {
    return `Máximo de ${regras.tamanho_max} caracteres.`;
  }

  // Regex customizada
  if (regras.validacao?.regex) {
    try {
      const re = new RegExp(regras.validacao.regex);
      if (!re.test(String(valor))) {
        return regras.validacao.mensagem || 'Formato inválido.';
      }
    } catch {
      // regex mal-formada — ignora
    }
  }

  return null;
}
