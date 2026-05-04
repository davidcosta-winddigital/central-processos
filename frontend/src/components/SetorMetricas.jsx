import { useEffect, useState } from 'react';
import { setores as apiSetores } from '../api/client.js';

function StatCard({ titulo, valor, icone, cor = 'brand', sub }) {
  const cores = {
    brand:  'from-brand-500/10 to-brand-600/5 text-brand-700 border-brand-100',
    purple: 'from-violet-500/10 to-violet-600/5 text-violet-700 border-violet-100',
    slate:  'from-slate-500/10 to-slate-600/5 text-slate-700 border-slate-200',
    amber:  'from-amber-500/10 to-amber-600/5 text-amber-700 border-amber-100',
  };
  return (
    <div className={`card border bg-gradient-to-br ${cores[cor]} p-5`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{titulo}</p>
          <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight">{valor}</p>
          {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
        </div>
        <div className="text-2xl opacity-70">{icone}</div>
      </div>
    </div>
  );
}

function ProcessosRecentes({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Processos recentes</p>
      <ul className="divide-y divide-slate-100">
        {items.map(p => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{p.titulo}</p>
              <p className="text-[11px] text-slate-400">
                {p.etapas_count ?? 0} {(p.etapas_count ?? 0) === 1 ? 'etapa' : 'etapas'}
                {p.created_at && ` · criado em ${new Date(p.created_at).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SetorMetricas({ setorId }) {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    apiSetores.metricas(setorId)
      .then(setData)
      .catch(() => setErro(true));
  }, [setorId]);

  if (erro) return null;
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card h-28 bg-slate-100" />
        ))}
      </div>
    );
  }

  const t = data.totais;

  return (
    <div className="space-y-4">
      {/* Cards de indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          titulo="Processos"
          valor={t.processos}
          icone="📋"
          cor="brand"
          sub={t.processos === 1 ? 'processo cadastrado' : 'processos cadastrados'}
        />
        <StatCard
          titulo="Membros"
          valor={t.membros}
          icone="👥"
          cor="purple"
          sub={t.membros === 1 ? 'usuário com acesso' : 'usuários com acesso'}
        />
        <StatCard
          titulo="Etapas"
          valor={t.etapas}
          icone="📝"
          cor="slate"
          sub="documentadas no setor"
        />
        <StatCard
          titulo="Campos"
          valor={t.campos}
          icone="🗂️"
          cor="amber"
          sub="no formulário do setor"
        />
      </div>

      {data.recentes?.length > 0 && (
        <ProcessosRecentes items={data.recentes} />
      )}
    </div>
  );
}
