import { useEffect, useState } from 'react';
import { infra as infraApi } from '../api/client.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const VAZIO = {
  nome: '', host: '', ambiente: 'Produção', tipo: 'agente', so: '',
  cpu_nucleos: 4, memoria_total_mb: 8192, disco_total_gb: 100,
  intervalo_segundos: 60, limite_cpu: 85, limite_memoria: 85, limite_disco: 90, ativo: true,
};

function BotaoCopiar({ texto }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* noop */ }
  };
  return (
    <button onClick={copiar} className="btn-secondary px-2 py-1 text-xs">
      {copiado ? 'Copiado!' : 'Copiar'}
    </button>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

// Bloco de comando com rótulo + copiar
function Bloco({ label, texto }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <BotaoCopiar texto={texto} />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">{texto}</pre>
    </div>
  );
}

const PLATAFORMAS = [
  { key: 'freebsd', label: 'TrueNAS / FreeBSD' },
  { key: 'linux',   label: 'Linux' },
  { key: 'windows', label: 'Windows' },
];

// ── Instruções de conexão (modelo cron, execução a cada 1 min) ────────────────
function Instrucoes({ servidor, onVoltar }) {
  const [plat, setPlat] = useState('freebsd');
  const token = servidor.token ?? '';
  const url = `${API_BASE}/infra/agente/${plat}`;

  const passos = {
    freebsd: {
      baixar: `fetch -o /mnt/POOL-0/scripts/cp-agente.sh "${url}"`,
      cron:   `* * * * * env API_URL="${API_BASE}" TOKEN="${token}" DISK_PATH="/mnt/POOL-0" /bin/sh /mnt/POOL-0/scripts/cp-agente.sh >/dev/null 2>&1`,
      nota:   'No TrueNAS CORE, salve o script num dataset (não em /tmp) e cadastre em Tasks → Cron Jobs (Run as root, Schedule = a cada 1 minuto), colando o comando acima como Command.',
    },
    linux: {
      baixar: `sudo curl -fsSL "${url}" -o /opt/cp-agente.sh`,
      cron:   `* * * * * env API_URL="${API_BASE}" TOKEN="${token}" DISK_PATH="/" /bin/sh /opt/cp-agente.sh >/dev/null 2>&1`,
      nota:   'Adicione a linha do cron com "crontab -e" (do usuário root, ou de um usuário com permissão).',
    },
    windows: {
      baixar: `iwr "${url}" -OutFile C:\\cp-agente.ps1`,
      cron:   `powershell -ExecutionPolicy Bypass -File C:\\cp-agente.ps1 -ApiUrl "${API_BASE}" -Token "${token}" -DiskPath "C:"`,
      nota:   'No Windows não há cron: crie uma Tarefa Agendada (Task Scheduler) com gatilho "repetir a cada 1 minuto" e ação executando o comando acima.',
    },
  };
  const p = passos[plat];

  return (
    <div className="space-y-5">
      <button onClick={onVoltar} className="text-sm text-slate-500 hover:text-slate-700">← Voltar</button>

      <div>
        <h3 className="text-lg font-bold text-slate-900">Conectar “{servidor.nome}”</h3>
        <p className="text-sm text-slate-500">
          O script roda <strong>no servidor</strong> via agendamento e envia as métricas por HTTP
          <strong> a cada 1 minuto</strong>. Não fica nenhum processo aberto — cada execução coleta e sai.
        </p>
      </div>

      {/* Seletor de plataforma */}
      <div className="flex gap-2">
        {PLATAFORMAS.map((x) => (
          <button
            key={x.key}
            onClick={() => setPlat(x.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${plat === x.key ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        ⚠️ Troque <code>{API_BASE}</code> por um endereço que o servidor consiga acessar, e ajuste
        o <code>DISK_PATH</code> para a partição que quer medir (ex.: <code>/mnt/POOL-0</code>).
      </div>

      <Bloco label="Token do servidor" texto={token} />
      <Bloco label="1) Baixar o script (uma vez)" texto={p.baixar} />
      <Bloco label={plat === 'windows' ? '2) Comando da Tarefa Agendada (a cada 1 min)' : '2) Agendar no cron (a cada 1 min)'} texto={p.cron} />

      <p className="text-xs text-slate-400">{p.nota}</p>
    </div>
  );
}

// ── Formulário ────────────────────────────────────────────────────────────────
function Formulario({ inicial, onSalvar, onCancelar, salvando }) {
  const [form, setForm] = useState(inicial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = (k, v) => set(k, v === '' ? '' : Number(v));

  return (
    <form onSubmit={e => { e.preventDefault(); onSalvar(form); }} className="space-y-4">
      <button type="button" onClick={onCancelar} className="text-sm text-slate-500 hover:text-slate-700">← Voltar</button>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome *">
          <input className="input" required autoFocus value={form.nome} onChange={e => set('nome', e.target.value)} />
        </Campo>
        <Campo label="Host / IP">
          <input className="input" value={form.host ?? ''} onChange={e => set('host', e.target.value)} />
        </Campo>
        <Campo label="Tipo">
          <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="agente">Servidor real (agente)</option>
            <option value="simulado">Simulado (demo)</option>
          </select>
        </Campo>
        <Campo label="Ambiente">
          <input className="input" value={form.ambiente ?? ''} onChange={e => set('ambiente', e.target.value)} />
        </Campo>
        <Campo label="Sistema operacional">
          <input className="input" value={form.so ?? ''} onChange={e => set('so', e.target.value)} placeholder="Ubuntu 22.04 / Windows…" />
        </Campo>
        <Campo label="Intervalo de envio (s)">
          <input type="number" min="1" max="300" className="input" value={form.intervalo_segundos} onChange={e => num('intervalo_segundos', e.target.value)} />
        </Campo>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Capacidade (fallback)</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Núcleos CPU"><input type="number" min="1" className="input" value={form.cpu_nucleos} onChange={e => num('cpu_nucleos', e.target.value)} /></Campo>
        <Campo label="Memória (MB)"><input type="number" min="1" className="input" value={form.memoria_total_mb} onChange={e => num('memoria_total_mb', e.target.value)} /></Campo>
        <Campo label="Disco (GB)"><input type="number" min="1" className="input" value={form.disco_total_gb} onChange={e => num('disco_total_gb', e.target.value)} /></Campo>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Limites de alerta (%)</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="CPU"><input type="number" min="1" max="100" className="input" value={form.limite_cpu} onChange={e => num('limite_cpu', e.target.value)} /></Campo>
        <Campo label="Memória"><input type="number" min="1" max="100" className="input" value={form.limite_memoria} onChange={e => num('limite_memoria', e.target.value)} /></Campo>
        <Campo label="Disco"><input type="number" min="1" max="100" className="input" value={form.limite_disco} onChange={e => num('limite_disco', e.target.value)} /></Campo>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancelar} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export default function GerenciarServidores({ onClose, onChange }) {
  const [lista, setLista] = useState([]);
  const [vista, setVista] = useState('lista'); // lista | form | instrucoes
  const [editando, setEditando] = useState(null);
  const [alvo, setAlvo] = useState(null);       // servidor das instruções
  const [confirmar, setConfirmar] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const recarregar = () => infraApi.listar().then(setLista).catch(() => {});
  useEffect(() => { recarregar(); }, []);

  const salvar = async (form) => {
    setSalvando(true); setErro('');
    try {
      const salvo = editando
        ? await infraApi.atualizar(editando.id, form)
        : await infraApi.criar(form);
      await recarregar();
      onChange?.();
      // Recém-criado do tipo agente → já mostra instruções de conexão
      if (!editando && salvo.tipo === 'agente') { setAlvo(salvo); setVista('instrucoes'); }
      else setVista('lista');
    } catch (e) {
      setErro(e.response?.data?.message ?? 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id) => {
    await infraApi.remover(id);
    setConfirmar(null);
    await recarregar();
    onChange?.();
  };

  const badgeTipo = (t) => t === 'agente'
    ? 'bg-brand-100 text-brand-700'
    : 'bg-slate-100 text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Gerenciar servidores</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>

        <div className="p-6">
          {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}

          {vista === 'lista' && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => { setEditando(null); setVista('form'); }}
                  className="btn-primary"
                >
                  + Adicionar servidor
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Nome</th>
                      <th className="px-4 py-2.5">Host</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lista.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nenhum servidor.</td></tr>
                    )}
                    {lista.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{s.nome}</td>
                        <td className="px-4 py-2.5 text-slate-500">{s.host || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeTipo(s.tipo)}`}>
                            {s.tipo === 'agente' ? 'Real' : 'Simulado'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {confirmar === s.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-slate-500">Excluir?</span>
                              <button onClick={() => excluir(s.id)} className="text-xs font-semibold text-red-600 hover:underline">Sim</button>
                              <button onClick={() => setConfirmar(null)} className="text-xs text-slate-500 hover:underline">Não</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-3 text-xs font-medium">
                              {s.tipo === 'agente' && (
                                <button onClick={() => { setAlvo(s); setVista('instrucoes'); }} className="text-brand-700 hover:underline">Conectar</button>
                              )}
                              <button onClick={() => { setEditando(s); setVista('form'); }} className="text-slate-600 hover:underline">Editar</button>
                              <button onClick={() => setConfirmar(s.id)} className="text-red-600 hover:underline">Excluir</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {vista === 'form' && (
            <Formulario
              inicial={editando ? { ...VAZIO, ...editando } : VAZIO}
              onSalvar={salvar}
              onCancelar={() => { setVista('lista'); setErro(''); }}
              salvando={salvando}
            />
          )}

          {vista === 'instrucoes' && alvo && (
            <Instrucoes servidor={alvo} onVoltar={() => setVista('lista')} />
          )}
        </div>
      </div>
    </div>
  );
}
