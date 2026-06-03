import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { infra as infraApi } from '../api/client.js';
import { getEcho } from '../echo.js';
import { fmtTamanho, fmtTamanhoMB, fmtUptime } from '../infraFmt.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtData = (iso) => { try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; } };
const HIST_MAX = 40;
const COR = { ok: '#10b981', alerta: '#f59e0b', critico: '#ef4444' };
const nivel = (p, l) => (p >= l ? 'critico' : p >= l * 0.85 ? 'alerta' : 'ok');

const STATUS = {
  ok:      { dot: 'bg-emerald-500', texto: 'Operacional', cor: 'text-emerald-600', bg: 'bg-emerald-50' },
  alerta:  { dot: 'bg-amber-500',   texto: 'Em alerta',   cor: 'text-amber-600',   bg: 'bg-amber-50' },
  critico: { dot: 'bg-red-500 animate-pulse', texto: 'Crítico', cor: 'text-red-600', bg: 'bg-red-50' },
  offline: { dot: 'bg-slate-400',   texto: 'Offline',     cor: 'text-slate-500',   bg: 'bg-slate-50' },
};

function Sparkline({ data, cor, alturaPx = 48 }) {
  if (!data || data.length < 2) return <div style={{ height: alturaPx }} />;
  const w = 240, h = 48;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (Math.min(Math.max(v, 0), 100) / 100) * h}`);
  const id = `sp-${cor.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: alturaPx }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={cor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Tile grande (estilo painel VMware)
function Tile({ titulo, valor, unidade, sub, serie, cor }) {
  return (
    <div className="card overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {valor}<span className="ml-1 text-sm font-medium text-slate-400">{unidade}</span>
          </p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
      <div className="-mx-4 -mb-4 mt-2">
        <Sparkline data={serie} cor={cor} />
      </div>
    </div>
  );
}

function Linha({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{children}</span>
    </div>
  );
}

function Secao({ titulo, children, acao }) {
  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{titulo}</h3>
        {acao}
      </div>
      {children}
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────
export default function ServidorDetalhe() {
  const { id } = useParams();
  const sid = Number(id);

  const [snap, setSnap] = useState(null);
  const [registro, setRegistro] = useState(null);
  const [hist, setHist] = useState({ cpu: [], mem: [], disco: [], rede: [] });
  const [obs, setObs] = useState([]);
  const [novaObs, setNovaObs] = useState('');
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const aplicar = (lista) => {
    const s = lista.find((x) => x.servidor_id === sid);
    if (!s) return;
    setSnap(s);
    setHist((h) => ({
      cpu:   [...h.cpu, s.cpu_percent].slice(-HIST_MAX),
      mem:   [...h.mem, s.memoria_percent].slice(-HIST_MAX),
      disco: [...h.disco, s.disco_percent].slice(-HIST_MAX),
      rede:  [...h.rede, Math.min(s.rede_rx_mbps + s.rede_tx_mbps, 100)].slice(-HIST_MAX),
    }));
  };

  const carregarObs = () => infraApi.observacoes.listar(sid).then(setObs).catch(() => {});

  useEffect(() => {
    let conectadoLocal = false;
    const setConn = (v) => { conectadoLocal = v; setConectado(v); };
    const buscar = () => infraApi.metricas().then((d) => aplicar(d.servidores)).catch(() => {});

    buscar().finally(() => setCarregando(false));
    infraApi.servidor(sid).then(setRegistro).catch(() => {});
    carregarObs();

    const echo = getEcho();
    if (echo) {
      const pusher = echo.connector?.pusher;
      if (pusher) {
        pusher.connection.bind('connected', () => setConn(true));
        pusher.connection.bind('disconnected', () => setConn(false));
        pusher.connection.bind('unavailable', () => setConn(false));
        setConn(pusher.connection.state === 'connected');
      }
      echo.private('infra.servidores').listen('.metricas.atualizadas', (e) => aplicar(e.servidores));
    }

    // Fallback: busca a cada 20s enquanto não houver WebSocket conectado.
    const poll = setInterval(() => { if (!conectadoLocal) buscar(); }, 20000);

    return () => {
      clearInterval(poll);
      if (echo) echo.leave('infra.servidores');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  const adicionarObs = async (e) => {
    e.preventDefault();
    if (!novaObs.trim()) return;
    setSalvandoObs(true);
    try {
      const o = await infraApi.observacoes.criar(sid, novaObs.trim());
      setObs((l) => [o, ...l]);
      setNovaObs('');
    } catch { /* noop */ } finally { setSalvandoObs(false); }
  };

  const removerObs = async (oid) => {
    await infraApi.observacoes.remover(oid);
    setObs((l) => l.filter((o) => o.id !== oid));
  };

  if (carregando) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>;
  }
  if (!snap) {
    return (
      <div className="card p-12 text-center text-slate-500">
        Servidor não encontrado. <Link to="/infra" className="text-brand-700 hover:underline">Voltar</Link>
      </div>
    );
  }

  const st = STATUS[snap.status] ?? STATUS.ok;

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/infra" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100">←</Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
              <h1 className="text-2xl font-bold text-slate-900">{snap.nome}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.bg} ${st.cor}`}>{st.texto}</span>
            </div>
            <p className="text-sm text-slate-500">{snap.host} · {snap.so} · {snap.ambiente}</p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${conectado ? 'animate-pulse bg-emerald-500' : 'bg-slate-300'}`} />
          <span className={conectado ? 'font-medium text-emerald-600' : 'text-slate-400'}>{conectado ? 'Ao vivo' : 'Conectando…'}</span>
        </span>
      </div>

      {/* Tiles de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile titulo="CPU" valor={snap.cpu_percent} unidade="%" sub={`${snap.cpu_nucleos} vCPU · load ${snap.load_avg[0]}`} serie={hist.cpu} cor={COR[nivel(snap.cpu_percent, snap.limites.cpu)]} />
        <Tile titulo="Memória" valor={fmtTamanhoMB(snap.memoria_usada_mb)} sub={`de ${fmtTamanhoMB(snap.memoria_total_mb)} · ${snap.memoria_percent}% em uso`} serie={hist.mem} cor={COR[nivel(snap.memoria_percent, snap.limites.memoria)]} />
        <Tile titulo="Armazenamento" valor={fmtTamanho(snap.disco_usado_gb)} sub={`de ${fmtTamanho(snap.disco_total_gb)} · ${snap.disco_percent}% em uso`} serie={hist.disco} cor={COR[nivel(snap.disco_percent, snap.limites.disco)]} />
        <Tile titulo="Rede" valor={`↓${snap.rede_rx_mbps}`} unidade={`↑${snap.rede_tx_mbps} Mb/s`} sub="tráfego atual" serie={hist.rede} cor="#0ea5e9" />
      </div>

      {/* Alertas ativos */}
      {snap.alertas?.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 text-sm font-semibold text-amber-800">⚠️ Alertas ativos</p>
          <ul className="list-inside list-disc text-sm text-amber-700">
            {snap.alertas.map((a, i) => <li key={i}>{a.mensagem}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Informações gerais */}
        <Secao titulo="Informações gerais">
          <Linha label="Nome do host">{snap.nome}</Linha>
          <Linha label="Endereço (IP)">{snap.host || '—'}</Linha>
          <Linha label="Sistema operacional">{snap.so || '—'}</Linha>
          <Linha label="Ambiente">{snap.ambiente}</Linha>
          <Linha label="Origem">{snap.tipo === 'agente' ? 'Servidor real (agente)' : 'Simulado'}</Linha>
          <Linha label="Status">{st.texto}</Linha>
          <Linha label="Uptime">{fmtUptime(snap.uptime_segundos)}</Linha>
          {registro && <Linha label="Intervalo de envio">{registro.intervalo_segundos}s</Linha>}
        </Secao>

        {/* Configuração de hardware */}
        <Secao titulo="Configuração de hardware">
          <Linha label="vCPUs">{snap.cpu_nucleos} núcleos</Linha>
          <Linha label="Memória total">{fmtTamanhoMB(snap.memoria_total_mb)}</Linha>
          <Linha label="Armazenamento total">{fmtTamanho(snap.disco_total_gb)}</Linha>
          <Linha label="Limite de alerta · CPU">{snap.limites.cpu}%</Linha>
          <Linha label="Limite de alerta · Memória">{snap.limites.memoria}%</Linha>
          <Linha label="Limite de alerta · Disco">{snap.limites.disco}%</Linha>
        </Secao>

        {/* Consumo de recursos */}
        <Secao titulo="Consumo de recursos">
          <Linha label="CPU">{snap.cpu_percent}% de {snap.cpu_nucleos} vCPU</Linha>
          <Linha label="Carga (load avg)">{snap.load_avg.join(' · ')}</Linha>
          <Linha label="Memória em uso">{fmtTamanhoMB(snap.memoria_usada_mb)} ({snap.memoria_percent}%)</Linha>
          <Linha label="Disco em uso">{fmtTamanho(snap.disco_usado_gb)} ({snap.disco_percent}%)</Linha>
          <Linha label="Rede ↓ / ↑">{snap.rede_rx_mbps} / {snap.rede_tx_mbps} Mb/s</Linha>
        </Secao>

        {/* Top processos */}
        <Secao titulo="Top processos">
          {snap.top_processos.length === 0 ? (
            <p className="py-2 text-sm text-slate-400">Sem dados.</p>
          ) : (
            <div className="space-y-1.5">
              {snap.top_processos.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-slate-700">{p.nome}</span>
                  <span className="ml-2 shrink-0 tabular-nums text-slate-400">cpu {p.cpu}% · mem {p.memoria}%</span>
                </div>
              ))}
            </div>
          )}
        </Secao>
      </div>

      {/* Observações */}
      <Secao titulo="Observações">
        <form onSubmit={adicionarObs} className="mb-4">
          <textarea
            className="input min-h-[72px] resize-y"
            placeholder="Escreva uma observação sobre este servidor (manutenção, incidente, contexto…)"
            value={novaObs}
            onChange={(e) => setNovaObs(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button className="btn-primary" disabled={salvandoObs || !novaObs.trim()}>
              {salvandoObs ? 'Salvando…' : 'Adicionar observação'}
            </button>
          </div>
        </form>

        {obs.length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-400">Nenhuma observação ainda.</p>
        ) : (
          <div className="space-y-3">
            {obs.map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  <span><strong className="text-slate-600">{o.autor || 'Usuário'}</strong> · {fmtData(o.created_at)}</span>
                  <button onClick={() => removerObs(o.id)} className="text-slate-400 hover:text-red-600" title="Remover">✕</button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{o.texto}</p>
              </div>
            ))}
          </div>
        )}
      </Secao>
    </div>
  );
}
