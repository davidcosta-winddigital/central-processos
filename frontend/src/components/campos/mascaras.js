// Máscaras simples baseadas em padrões com '9' (dígito) e 'A' (letra).
// Suficiente para CPF/CNPJ/CEP/telefone sem dependência externa.

export function aplicarMascara(valor, mascara) {
  if (!mascara || valor == null) return valor ?? '';
  const v = String(valor).replace(/\D/g, '');
  let saida = '';
  let i = 0;
  for (const c of mascara) {
    if (i >= v.length) break;
    if (c === '9') {
      saida += v[i++];
    } else {
      saida += c;
    }
  }
  return saida;
}

export const MASCARAS_PADRAO = {
  cpf: '999.999.999-99',
  cnpj: '99.999.999/9999-99',
  cep: '99999-999',
  telefone: '(99) 99999-9999',
};

export function validarCPF(cpf) {
  cpf = String(cpf ?? '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += +cpf[i] * (10 - i);
  let d1 = (soma * 10) % 11; if (d1 === 10) d1 = 0;
  if (d1 !== +cpf[9]) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += +cpf[i] * (11 - i);
  let d2 = (soma * 10) % 11; if (d2 === 10) d2 = 0;
  return d2 === +cpf[10];
}

export function validarCNPJ(cnpj) {
  cnpj = String(cnpj ?? '').replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = base => {
    let soma = 0;
    let pos = base.length - 7;
    for (let i = base.length; i >= 1; i--) {
      soma += +base[base.length - i] * pos--;
      if (pos < 2) pos = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(cnpj.slice(0, 12));
  if (d1 !== +cnpj[12]) return false;
  const d2 = calc(cnpj.slice(0, 13));
  return d2 === +cnpj[13];
}

export function formatarMoeda(valor) {
  if (valor === '' || valor == null) return '';
  const num = typeof valor === 'number' ? valor : Number(String(valor).replace(',', '.'));
  if (Number.isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
