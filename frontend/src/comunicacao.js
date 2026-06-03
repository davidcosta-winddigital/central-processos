// ============================================================
// Arquivo de comunicação — endereços de LOCAL e PRODUÇÃO.
// O ambiente é detectado automaticamente pelo domínio em que a
// aplicação está aberta, então o MESMO build funciona nos dois.
// ============================================================

const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const ehLocal = ['localhost', '127.0.0.1'].includes(host);

// ── PRODUÇÃO ────────────────────────────────────────────────
const PRODUCAO = {
  ambiente: 'producao',
  apiUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://processos.winddigital.com.br'}/api`,
  ws: { host, port: 443, scheme: 'wss' },
};

// ── LOCAL (desenvolvimento) ─────────────────────────────────
const LOCAL = {
  ambiente: 'local',
  apiUrl: 'http://localhost:8000/api',
  ws: { host: 'localhost', port: 8080, scheme: 'ws' },
};

export const COMM = ehLocal ? LOCAL : PRODUCAO;
