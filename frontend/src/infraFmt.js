// Formatação compartilhada do módulo de Infraestrutura.

// Tamanho a partir de GB: até 999 GB mostra "GB"; de 1000 GB em diante mostra "TB".
export function fmtTamanho(gb) {
  const n = Number(gb) || 0;
  if (n >= 1000) return `${(n / 1024).toFixed(2)} TB`;
  if (n >= 100) return `${Math.round(n)} GB`;
  return `${n.toFixed(1)} GB`;
}

// Mesmo formato, recebendo MB.
export const fmtTamanhoMB = (mb) => fmtTamanho((Number(mb) || 0) / 1024);

// Uptime legível, protegido contra valores absurdos (ex.: boot mal lido no agente).
export function fmtUptime(s) {
  const v = Number(s) || 0;
  if (v <= 0 || v > 630720000) return '—'; // > 20 anos = inválido
  const d = Math.floor(v / 86400);
  const h = Math.floor((v % 86400) / 3600);
  const m = Math.floor((v % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}
