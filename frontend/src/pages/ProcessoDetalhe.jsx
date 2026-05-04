import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  etapas as apiEtapas,
  processoCampos as apiProcessoCampos,
  processos as apiProcessos,
} from '../api/client.js';
import Anexos from '../components/Anexos.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import CampoDinamico from '../components/CampoDinamico.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useConfirm } from '../contexts/ConfirmContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const TIPOS = [
  { value: 'texto',  label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'data',   label: 'Data' },
  { value: 'selecao',label: 'Seleção' },
];
const CAMPO_VAZIO = { nome: '', rotulo: '', tipo: 'texto', opcoes: '', obrigatorio: false, valor: '' };

export default function ProcessoDetalhe() {
  const { processoId } = useParams();
  const { isAdmin }    = useAuth();
  const toast          = useToast();
  const confirm        = useConfirm();

  const [processo, setProcesso]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [novaEtapa, setNovaEtapa] = useState({ titulo: '', descricao: '' });
  const [etapaAberta, setEtapaAberta] = useState(null);

  // edição do processo
  const [editando, setEditando]   = useState(false);
  const [editForm, setEditForm]   = useState({ titulo: '', descricao: '', valores: {} });
  const [saving, setSaving]       = useState(false);

  // campos do processo
  const [campoModal, setCampoModal] = useState(false);
  const [editCampo, setEditCampo]   = useState(null);
  const [campoForm, setCampoForm]   = useState(CAMPO_VAZIO);
  const [savingCampo, setSavingCampo] = useState(false);

  const load = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      setProcesso(await apiProcessos.obter(processoId));
    } catch {
      toast('Erro ao carregar processo.', 'error');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { load({ showLoading: true }); }, [processoId]);

  const mapaCampos = useMemo(() => {
    const m = new Map();
    processo?.setor?.campos?.forEach(c => m.set(c.id, c));
    return m;
  }, [processo]);

  // ── Etapas (apenas estruturais) ───────────────────────────────────────────
  const addEtapa = async e => {
    e.preventDefault();
    if (!novaEtapa.titulo.trim()) return;
    try {
      await apiEtapas.criar(processoId, {
        titulo:    novaEtapa.titulo.trim(),
        descricao: novaEtapa.descricao.trim() || null,
      });
      setNovaEtapa({ titulo: '', descricao: '' });
      toast('Etapa adicionada!');
      load();
    } catch { toast('Erro ao adicionar etapa.', 'error'); }
  };

  const removeEtapa = async etapa => {
    if (!await confirm(`Remover "${etapa.titulo}"?`, 'Remover etapa')) return;
    try {
      await apiEtapas.remover(etapa.id);
      toast('Etapa removida.');
      if (etapaAberta?.id === etapa.id) setEtapaAberta(null);
      load();
    } catch { toast('Erro ao remover etapa.', 'error'); }
  };

  const openEtapa = etapa => setEtapaAberta(etapa);

  const refreshEtapaAberta = anexos => {
    if (!etapaAberta) return;
    const next = { ...etapaAberta, anexos };
    setEtapaAberta(next);
    setProcesso(prev => prev ? ({
      ...prev,
      etapas: prev.etapas?.map(item => item.id === next.id ? next : item) ?? [],
    }) : prev);
  };

  // ── Edição do processo ────────────────────────────────────────────────────
  const openEdit = () => {
    const valMap = {};
    processo.valores?.forEach(v => { valMap[v.campo_personalizado_id] = v.valor ?? ''; });
    processo.setor?.campos?.forEach(c => { if (!(c.id in valMap)) valMap[c.id] = ''; });
    setEditForm({ titulo: processo.titulo, descricao: processo.descricao ?? '', valores: valMap });
    setEditando(true);
  };

  const saveEdit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiProcessos.atualizar(processoId, {
        titulo:    editForm.titulo,
        descricao: editForm.descricao,
        valores:   Object.entries(editForm.valores).map(([id, valor]) => ({
          campo_personalizado_id: Number(id),
          valor: valor || null,
        })),
      });
      toast('Processo atualizado!');
      setEditando(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao atualizar.', 'error');
    } finally { setSaving(false); }
  };

  // ── Campos do processo ────────────────────────────────────────────────────
  const openNovoCampo = () => { setEditCampo(null); setCampoForm(CAMPO_VAZIO); setCampoModal(true); };
  const openEditCampo = c => {
    setEditCampo(c);
    setCampoForm({
      nome:        c.nome,
      rotulo:      c.rotulo,
      tipo:        c.tipo,
      opcoes:      (c.opcoes ?? []).join('\n'),
      obrigatorio: !!c.obrigatorio,
      valor:       c.valor ?? '',
    });
    setCampoModal(true);
  };

  const saveCampo = async e => {
    e.preventDefault();
    setSavingCampo(true);
    const payload = {
      nome:        campoForm.nome,
      rotulo:      campoForm.rotulo,
      tipo:        campoForm.tipo,
      obrigatorio: campoForm.obrigatorio,
      valor:       campoForm.valor || null,
      opcoes:      campoForm.tipo === 'selecao'
        ? campoForm.opcoes.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
    };
    try {
      if (editCampo) {
        await apiProcessoCampos.atualizar(editCampo.id, payload);
        toast('Campo atualizado!');
      } else {
        await apiProcessoCampos.criar(processoId, payload);
        toast('Campo criado!');
      }
      setCampoModal(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao salvar campo.', 'error');
    } finally { setSavingCampo(false); }
  };

  const removeCampo = async c => {
    if (!await confirm(`Excluir o campo "${c.rotulo}"?`, 'Excluir campo')) return;
    try {
      await apiProcessoCampos.remover(c.id);
      toast('Campo excluído.');
      load();
    } catch { toast('Erro ao excluir campo.', 'error'); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-64 rounded bg-slate-200" />
      <div className="card p-6 space-y-3">
        <div className="h-7 w-72 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
      </div>
    </div>
  );

  if (!processo) return <p className="text-red-600">Processo não encontrado.</p>;

  const total = processo.etapas?.length ?? 0;
  const processosCampos = processo.processo_campos ?? [];

  return (
    <div className="space-y-6 pb-8">
      <Breadcrumb items={[
        { label: 'Setores', to: '/' },
        { label: processo.setor?.nome ?? 'Setor', to: `/setores/${processo.setor_id}` },
        { label: processo.titulo },
      ]} />

      {/* Header */}
      <div className="card overflow-hidden p-0 border-brand-100/80">
        <div className="h-2 w-full bg-brand-700" />
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="badge">{total} {total === 1 ? 'etapa' : 'etapas'}</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">{processo.titulo}</h2>
              {processo.descricao && (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{processo.descricao}</p>
              )}
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                Setor: <span className="font-medium text-slate-500">{processo.setor?.nome}</span>
              </p>
            </div>
            {isAdmin && (
              <button className="btn-ghost border border-slate-200 text-sm shrink-0" onClick={openEdit}>
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Campos do setor (valores) */}
      {processo.valores?.length > 0 && (
        <div className="card mb-6 p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Informações do setor
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {processo.valores.map(v => {
              const campo = mapaCampos.get(v.campo_personalizado_id) ?? v.campo;
              return (
                <div key={v.id} className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {campo?.rotulo ?? campo?.nome}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {v.valor || <span className="font-normal text-slate-300">—</span>}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      {/* Campos específicos do processo */}
      {(processosCampos.length > 0 || isAdmin) && (
        <div className="card mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Campos deste processo
            </h3>
            {isAdmin && (
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={openNovoCampo}>
                + Novo campo
              </button>
            )}
          </div>

          {processosCampos.length === 0 ? (
            <p className="text-sm text-slate-400">
              {isAdmin ? 'Nenhum campo criado. Clique em "+ Novo campo" para adicionar.' : 'Nenhum campo cadastrado.'}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {processosCampos.map(c => (
                <div key={c.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {c.rotulo}
                    </dt>
                    {isAdmin && (
                      <div className="flex shrink-0 gap-1">
                        <button className="text-xs text-slate-400 hover:text-brand-600" onClick={() => openEditCampo(c)}>editar</button>
                        <button className="text-xs text-slate-400 hover:text-red-500" onClick={() => removeCampo(c)}>×</button>
                      </div>
                    )}
                  </div>
                  <dd className="text-sm font-medium text-slate-800">
                    {c.valor || <span className="font-normal text-slate-300">—</span>}
                  </dd>
                  <p className="mt-0.5 text-xs text-slate-400">{c.tipo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Etapas */}
      <div className="card p-6 md:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Etapas
              {total > 0 && <span className="ml-2 text-sm font-normal text-slate-400">({total})</span>}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Documentação dos passos deste processo. Clique em uma etapa para ver detalhes e arquivos.
            </p>
          </div>
        </div>

        {total === 0 && <p className="mb-4 text-sm text-slate-400">Nenhuma etapa cadastrada.</p>}

        <ol className="mb-5 grid gap-3 lg:grid-cols-2">
          {processo.etapas?.map((etapa, i) => (
            <li
              key={etapa.id}
              className="group rounded-2xl border border-slate-200 bg-white p-0 transition-all hover:border-brand-200 hover:bg-brand-50/40"
            >
              <div className="flex h-full flex-col p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                    {i + 1}
                  </div>
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => openEtapa(etapa)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                          {etapa.titulo}
                        </p>
                        {etapa.descricao && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{etapa.descricao}</p>
                        )}
                      </div>
                      <span className="badge-gray shrink-0">{etapa.anexos?.length ?? 0} arquivos</span>
                    </div>
                  </button>
                  {isAdmin && (
                    <button
                      className="shrink-0 text-xs text-slate-300 hover:text-red-500 transition-colors"
                      onClick={() => removeEtapa(etapa)}
                    >
                      remover
                    </button>
                  )}
                </div>
                <button
                  className="mt-3 text-left text-xs font-semibold text-brand-600 transition-colors hover:text-brand-800"
                  onClick={() => openEtapa(etapa)}
                >
                  Abrir detalhes da etapa
                </button>
              </div>
            </li>
          ))}
        </ol>

        {isAdmin && (
          <form onSubmit={addEtapa} className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Título da nova etapa..."
                value={novaEtapa.titulo}
                onChange={e => setNovaEtapa(p => ({ ...p, titulo: e.target.value }))}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={!novaEtapa.titulo.trim()}>
                Adicionar
              </button>
            </div>
            <input
              className="input text-xs"
              placeholder="Descrição (opcional)"
              value={novaEtapa.descricao}
              onChange={e => setNovaEtapa(p => ({ ...p, descricao: e.target.value }))}
            />
          </form>
        )}
      </div>

      {/* Modal editar processo */}
      <Modal open={editando} onClose={() => setEditando(false)} title="Editar processo"
        footer={<>
          <button className="btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
          <button className="btn-primary" form="edit-proc-form" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
        </>}
      >
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <form id="edit-proc-form" onSubmit={saveEdit} className="space-y-4">
            <div>
              <label className="label">Título *</label>
              <input className="input" required autoFocus value={editForm.titulo}
                onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea className="input min-h-[80px] resize-none" value={editForm.descricao}
                onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>

            {processo.setor?.campos?.length > 0 && (
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                  Campos do setor — {processo.setor.nome}
                </p>
                {processo.setor.campos.map(campo => (
                  <CampoDinamico
                    key={campo.id}
                    campo={campo}
                    value={editForm.valores?.[campo.id] ?? ''}
                    onChange={val => setEditForm(f => ({
                      ...f,
                      valores: { ...f.valores, [campo.id]: val },
                    }))}
                  />
                ))}
              </div>
            )}
          </form>
        </div>
      </Modal>

      {/* Modal etapa (somente leitura/anexos) */}
      <Modal
        open={!!etapaAberta}
        onClose={() => setEtapaAberta(null)}
        title={etapaAberta ? `Etapa ${processo.etapas?.findIndex(e => e.id === etapaAberta.id) + 1} - ${etapaAberta.titulo}` : 'Etapa'}
        size="lg"
        footer={
          <button className="btn-ghost" onClick={() => setEtapaAberta(null)}>Fechar</button>
        }
      >
        {etapaAberta && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="badge-gray">{etapaAberta.anexos?.length ?? 0} arquivos</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900">{etapaAberta.titulo}</h4>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                {etapaAberta.descricao || 'Sem descrição detalhada para esta etapa.'}
              </p>
            </div>

            <Anexos
              etapaId={etapaAberta.id}
              isAdmin={isAdmin}
              title="Arquivos desta etapa"
              compact
              initialFiles={etapaAberta.anexos ?? []}
              onUpdated={refreshEtapaAberta}
            />
          </div>
        )}
      </Modal>

      {/* Modal campo do processo */}
      <Modal open={campoModal} onClose={() => setCampoModal(false)}
        title={editCampo ? 'Editar campo do processo' : 'Novo campo do processo'}
        footer={<>
          <button className="btn-ghost" onClick={() => setCampoModal(false)}>Cancelar</button>
          <button className="btn-primary" form="campo-proc-form" disabled={savingCampo}>
            {savingCampo ? 'Salvando...' : 'Salvar'}
          </button>
        </>}
      >
        <form id="campo-proc-form" onSubmit={saveCampo} className="space-y-3">
          <div>
            <label className="label">Rótulo *</label>
            <input className="input" required autoFocus placeholder="ex: Responsável"
              value={campoForm.rotulo}
              onChange={e => setCampoForm(f => ({ ...f, rotulo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nome técnico *</label>
            <input className="input font-mono text-xs" required placeholder="ex: responsavel"
              pattern="^[a-zA-Z][a-zA-Z0-9_]*$"
              value={campoForm.nome}
              onChange={e => setCampoForm(f => ({ ...f, nome: e.target.value }))} />
            <p className="mt-1 text-xs text-slate-400">Letras, números e underline; começa com letra.</p>
          </div>
          <div>
            <label className="label">Tipo *</label>
            <select className="input" value={campoForm.tipo}
              onChange={e => setCampoForm(f => ({ ...f, tipo: e.target.value }))}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {campoForm.tipo === 'selecao' && (
            <div>
              <label className="label">Opções (uma por linha)</label>
              <textarea className="input min-h-[80px] resize-none font-mono text-xs"
                value={campoForm.opcoes}
                onChange={e => setCampoForm(f => ({ ...f, opcoes: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="label">Valor</label>
            {campoForm.tipo === 'selecao' ? (
              <select className="input" value={campoForm.valor}
                onChange={e => setCampoForm(f => ({ ...f, valor: e.target.value }))}>
                <option value="">Selecione...</option>
                {campoForm.opcoes.split('\n').map(o => o.trim()).filter(Boolean).map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                type={campoForm.tipo === 'numero' ? 'number' : campoForm.tipo === 'data' ? 'date' : 'text'}
                value={campoForm.valor}
                onChange={e => setCampoForm(f => ({ ...f, valor: e.target.value }))} />
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 hover:bg-slate-50">
            <input type="checkbox" checked={campoForm.obrigatorio}
              onChange={e => setCampoForm(f => ({ ...f, obrigatorio: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            Campo obrigatório
          </label>
        </form>
      </Modal>
    </div>
  );
}
