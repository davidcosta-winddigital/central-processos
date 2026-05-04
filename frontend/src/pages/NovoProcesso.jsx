import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  processos as apiProcessos,
  setores as apiSetores,
} from '../api/client.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import CampoDinamico from '../components/CampoDinamico.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function NovoProcesso() {
  const { setorId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [setor, setSetor] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [etapas, setEtapas] = useState([{ titulo: '', descricao: '' }]);
  const [valores, setValores] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    apiSetores.obter(setorId)
      .then(setSetor)
      .catch(() => toast('Erro ao carregar setor.', 'error'));
  }, [setorId]);

  const camposVisiveis = useMemo(() => {
    return [...(setor?.campos ?? [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [setor]);

  const camposPorSecao = useMemo(() => {
    const grupos = {};
    camposVisiveis.forEach(c => {
      const secao = c.secao || 'Campos do formulário';
      if (!grupos[secao]) grupos[secao] = [];
      grupos[secao].push(c);
    });
    return grupos;
  }, [camposVisiveis]);

  const mapaCamposPorNome = useMemo(() => {
    const m = {};
    camposVisiveis.forEach(c => { m[c.nome] = c.id; });
    return m;
  }, [camposVisiveis]);

  const updateEtapa = (i, patch) =>
    setEtapas(prev => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const addEtapa = () =>
    setEtapas(prev => [...prev, { titulo: '', descricao: '' }]);

  const removeEtapa = i =>
    setEtapas(prev => prev.filter((_, idx) => idx !== i));

  const salvar = async e => {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = {
        titulo,
        descricao,
        etapas: etapas.filter(x => x.titulo.trim() !== ''),
        valores: Object.entries(valores)
          .filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && v.length === 0))
          .map(([id, v]) => ({
            campo_personalizado_id: Number(id),
            valor: v,
          })),
      };
      const criado = await apiProcessos.criar(setorId, payload);
      toast('Processo criado com sucesso!');
      navigate(`/processos/${criado.id}`);
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao criar processo.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  if (!setor) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-48 rounded bg-slate-200" />
      <div className="card p-6">
        <div className="h-6 w-36 rounded bg-slate-200 mb-6" />
        <div className="space-y-3">
          <div className="h-9 rounded bg-slate-100" />
          <div className="h-20 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Setores', to: '/' },
          { label: setor.nome, to: `/setores/${setor.id}` },
          { label: 'Novo processo' },
        ]}
      />

      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Novo processo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Setor: <span className="font-medium text-slate-700">{setor.nome}</span>
          </p>
        </div>

        <form onSubmit={salvar} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Título *</label>
              <input
                className="input"
                required
                autoFocus
                placeholder="Nome do processo"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descrição</label>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="Descreva o objetivo deste processo..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
              />
            </div>
          </div>

          {/* Campos do formulário, agrupados por seção */}
          {Object.entries(camposPorSecao).map(([secao, campos]) => (
            <fieldset key={secao} className="rounded-xl border border-slate-200 p-5">
              <legend className="-ml-1 px-1 text-sm font-semibold text-slate-700">{secao}</legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {campos.map(campo => (
                  <div
                    key={campo.id}
                    className={campo.coluna === 2 ? '' : 'sm:col-span-2'}
                  >
                    <CampoDinamico
                      campo={campo}
                      value={valores[campo.id] ?? ''}
                      onChange={v => setValores(prev => ({ ...prev, [campo.id]: v }))}
                      todosValores={valores}
                      mapaCamposPorNome={mapaCamposPorNome}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}

          {/* Etapas */}
          <fieldset className="rounded-xl border border-slate-200 p-5">
            <legend className="-ml-1 px-1 text-sm font-semibold text-slate-700">
              Etapas do processo
            </legend>
            <p className="mt-1 text-xs text-slate-500">
              Documente os passos que compõem este processo. Apenas para visualização — não há marcação de conclusão.
            </p>
            <div className="mt-3 space-y-2">
              {etapas.map((etapa, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <span className="mt-2 w-5 shrink-0 text-center text-xs font-semibold text-slate-400">
                    {i + 1}.
                  </span>
                  <div className="flex-1 grid gap-2 sm:grid-cols-2">
                    <input
                      className="input"
                      placeholder="Título da etapa *"
                      value={etapa.titulo}
                      onChange={e => updateEtapa(i, { titulo: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Descrição (opcional)"
                      value={etapa.descricao}
                      onChange={e => updateEtapa(i, { descricao: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-2 shrink-0 text-xs text-slate-400 hover:text-red-500 transition-colors"
                    onClick={() => removeEtapa(i)}
                    disabled={etapas.length === 1}
                  >
                    remover
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-ghost mt-3 text-sm"
              onClick={addEtapa}
            >
              + Adicionar etapa
            </button>
          </fieldset>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate(`/setores/${setor.id}`)}
            >
              Cancelar
            </button>
            <button className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Criar processo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
