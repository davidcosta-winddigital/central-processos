import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { infra as infraApi } from '../api/client.js';
import { getEcho } from '../echo.js';
import GerenciarServidores from './GerenciarServidores.jsx';
import { fmtTamanho, fmtTamanhoMB, fmtUptime } from '../infraFmt.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
const HIST_MAX = 30;

const COR = { ok: '#10b981', alerta: '#f59e0b', critico: '#ef4444' };
function nivelMetrica(pct, limite) {
  if (pct >= limite) return 'critico';
  if (pct >= limite * 0.85) return 'alerta';
  return 'ok';
}

const STATUS = {
  ok:      { dot: 'bg-emerald-500', ring: 'border-slate-200',                       texto: 'Operacional', cor: 'text-emerald-600' },
  alerta:  { dot: 'bg-amber-500',   ring: 'border-amber-300 ring-1 ring-amber-200', texto: 'Em alerta',   cor: 'text-amber-600' },
  critico: { dot: 'bg-red-500 animate-pulse', ring: 'border-red-300 ring-2 ring-red-200', texto: 'Crítico', cor: 'text-red-600' },
  offline: { dot: 'bg-slate-400',   ring: 'border-slate-300',                       texto: 'Offline',     cor: 'text-slate-500' },
};

// ── Gauge radial (donut SVG) ─────────────────────────────────────────────────
function RadialGauge({ label, sub, pct, limite }) {
  const size = 92, sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const cor = COR[nivelMetrica(pct, limite)];
  const dash = (Math.min(pct, 100) / 100) * circ;
  // ângulo da marca de limite (0% no topo, sentido horário)
  const ang = (limite / 100) * 2 * Math.PI - Math.PI / 2;
  const tick = {
    x1: size / 2 + (r - sw / 2) * Math.cos(ang),
    y1: size / 2 + (r - sw / 2) * Math.sin(ang),
    x2: size / 2 + (r + sw / 2) * Math.cos(ang),
    y2: size / 2 + (r + sw / 2) * Math.sin(ang),
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f6" strokeWidth={sw} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={cor} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray .7s ease, stroke .3s ease' }}
          />
          <line {...tick} stroke="#94a3b8" strokeWidth="2" className="rotate-90" style={{ transformOrigin: 'center' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-extrabold tabular-nums" style={{ color: cor }}>
            {pct > 0 && pct < 10 ? pct.toFixed(1) : Math.round(pct)}<span className="text-[10px]">%</span>
          </span>
        </div>
      </div>
      <span className="mt-1.5 text-xs font-semibold text-slate-700">{label}</span>
      <span className="text-[10px] text-slate-400">{sub}</span>
    </div>
  );
}

// ── Sparkline (tendência) ────────────────────────────────────────────────────
function Sparkline({ data, cor }) {
  if (!data || data.length < 2) return <div className="h-6 w-full" />;
  const w = 100, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (Math.min(Math.max(v, 0), 100) / 100) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `0,${h} ${pts.join(' ')} ${w},${h}`;
  const id = `g-${cor.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={cor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── Card de servidor ─────────────────────────────────────────────────────────
function ServerCard({ s, hist }) {
  const st = STATUS[s.status] ?? STATUS.ok;
  const h = hist ?? { cpu: [], mem: [], disco: [] };

  const metricas = [
    { label: 'CPU',     pct: s.cpu_percent,     limite: s.limites.cpu,     sub: `${s.cpu_nucleos} núcleos`, serie: h.cpu },
    { label: 'Memória', pct: s.memoria_percent, limite: s.limites.memoria, sub: `${fmtTamanhoMB(s.memoria_usada_mb)} / ${fmtTamanhoMB(s.memoria_total_mb)}`, serie: h.mem },
    { label: 'Disco',   pct: s.disco_percent,   limite: s.limites.disco,   sub: `${fmtTamanho(s.disco_usado_gb)} / ${fmtTamanho(s.disco_total_gb)}`, serie: h.disco },
  ];

  return (
    <div className={`card border p-5 transition-all ${st.ring}`}>
      {/* Cabeçalho */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} />
            <h3 className="truncate font-bold text-slate-900">{s.nome}</h3>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">{s.host} · {s.so}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {s.ambiente}
          </span>
          <p className={`mt-1 text-[11px] font-semibold ${st.cor}`}>{st.texto}</p>
        </div>
      </div>

      {/* Gauges + sparklines */}
      <div className="grid grid-cols-3 gap-2">
        {metricas.map((m) => (
          <div key={m.label} className="flex flex-col items-center">
            <RadialGauge label={m.label} sub={m.sub} pct={m.pct} limite={m.limite} />
            <div className="mt-2 w-full px-0.5">
              <Sparkline data={m.serie} cor={COR[nivelMetrica(m.pct, m.limite)]} />
            </div>
          </div>
        ))}
      </div>

      {/* Rede + load + uptime */}
      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">↓ Rede</p>
          <p className="text-sm font-semibold tabular-nums text-slate-700">{s.rede_rx_mbps}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">↑ Rede</p>
          <p className="text-sm font-semibold tabular-nums text-slate-700">{s.rede_tx_mbps}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Load</p>
          <p className="text-sm font-semibold tabular-nums text-slate-700">{s.load_avg[0]}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Uptime</p>
          <p className="text-sm font-semibold tabular-nums text-slate-700">{fmtUptime(s.uptime_segundos)}</p>
        </div>
      </div>

      {/* Top processos */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Top processos</p>
        <div className="space-y-1">
          {s.top_processos.slice(0, 4).map((p, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="truncate font-medium text-slate-600">{p.nome}</span>
              <span className="ml-2 shrink-0 tabular-nums text-slate-400">cpu {p.cpu}% · mem {p.memoria}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé: detalhes */}
      <div className="mt-3 border-t border-slate-100 pt-3">
        <Link
          to={`/infra/servidores/${s.servidor_id}`}
          className="flex items-center justify-center rounded-lg bg-slate-50 py-2 text-xs font-semibold text-brand-700 hover:bg-slate-100"
        >
          Ver detalhes →
        </Link>
      </div>
    </div>
  );
}

// ── Cartão de resumo ─────────────────────────────────────────────────────────
function Resumo({ label, valor, cor }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`h-9 w-1.5 rounded-full ${cor}`} />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{valor}</p>
      </div>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────
export default function Infraestrutura() {
  const [servidores, setServidores] = useState([]);
  const [hist, setHist] = useState({});
  const [conectado, setConectado] = useState(false);
  const [modoPolling, setModoPolling] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [gerenciar, setGerenciar] = useState(false);

  const recarregar = () => infraApi.metricas().then((d) => registrar(d.servidores)).catch(() => {});

  const registrar = (lista) => {
    setServidores(lista);
    setUltimaAtualizacao(new Date());
    setHist((prev) => {
      const next = { ...prev };
      lista.forEach((s) => {
        const h = next[s.servidor_id] ?? { cpu: [], mem: [], disco: [] };
        next[s.servidor_id] = {
          cpu:   [...h.cpu, s.cpu_percent].slice(-HIST_MAX),
          mem:   [...h.mem, s.memoria_percent].slice(-HIST_MAX),
          disco: [...h.disco, s.disco_percent].slice(-HIST_MAX),
        };
      });
      return next;
    });
  };

  useEffect(() => {
    let conectadoLocal = false;
    const setConn = (v) => { conectadoLocal = v; setConectado(v); if (v) setModoPolling(false); };

    recarregar().finally(() => setCarregando(false));

    // WebSocket (se disponível no ambiente)
    const echo = getEcho();
    if (echo) {
      const pusher = echo.connector?.pusher;
      if (pusher) {
        pusher.connection.bind('connected', () => setConn(true));
        pusher.connection.bind('disconnected', () => setConn(false));
        pusher.connection.bind('unavailable', () => setConn(false));
        setConn(pusher.connection.state === 'connected');
      }
      echo.private('infra.servidores').listen('.metricas.atualizadas', (e) => registrar(e.servidores));
    } else {
      setModoPolling(true);
    }

    // Se o WS não conectar em 8s, assume modo polling.
    const tmo = setTimeout(() => { if (!conectadoLocal) setModoPolling(true); }, 8000);

    // Fallback: busca a cada 20s enquanto não houver WebSocket conectado.
    const poll = setInterval(() => { if (!conectadoLocal) recarregar(); }, 20000);

    return () => {
      clearTimeout(tmo);
      clearInterval(poll);
      if (echo) echo.leave('infra.servidores');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alertasGlobais = servidores.flatMap((s) =>
    s.alertas.map((a) => ({ ...a, servidor: s.nome })),
  );
  const cont = (st) => servidores.filter((s) => s.status === st).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Infraestrutura</h1>
          <p className="text-sm text-slate-500">Monitoramento de servidores em tempo real</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${conectado ? 'animate-pulse bg-emerald-500' : modoPolling ? 'bg-sky-500' : 'bg-slate-300'}`} />
            <span className={conectado ? 'font-medium text-emerald-600' : modoPolling ? 'text-sky-600' : 'text-slate-400'}>
              {conectado ? 'Ao vivo' : modoPolling ? 'Atualizando (20s)' : 'Conectando…'}
            </span>
          </span>
          {ultimaAtualizacao && (
            <span className="text-xs text-slate-400">atualizado {ultimaAtualizacao.toLocaleTimeString('pt-BR')}</span>
          )}
          <button onClick={() => setGerenciar(true)} className="btn-secondary">Gerenciar servidores</button>
        </div>
      </div>

      {gerenciar && (
        <GerenciarServidores onClose={() => setGerenciar(false)} onChange={recarregar} />
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Resumo label="Servidores" valor={servidores.length} cor="bg-slate-300" />
        <Resumo label="Operacionais" valor={cont('ok')} cor="bg-emerald-500" />
        <Resumo label="Em alerta" valor={cont('alerta')} cor="bg-amber-500" />
        <Resumo label="Críticos" valor={cont('critico')} cor="bg-red-500" />
      </div>

      {/* Banner de alertas */}
      {alertasGlobais.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <span>⚠️</span> {alertasGlobais.length} alerta(s) ativo(s)
          </p>
          <div className="flex flex-wrap gap-2">
            {alertasGlobais.map((a, i) => (
              <span
                key={i}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  a.nivel === 'critico' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <strong>{a.servidor}</strong> — {a.mensagem}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grid de servidores */}
      {carregando ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : servidores.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">Nenhum servidor cadastrado.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servidores.map((s) => (
            <ServerCard key={s.servidor_id} s={s} hist={hist[s.servidor_id]} />
          ))}
        </div>
      )}
    </div>
  );
}
