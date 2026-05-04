import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { processos as apiProcessos, setores as apiSetores } from '../api/client.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Can from '../components/Can.jsx';
import Modal from '../components/Modal.jsx';
import SetorMetricas from '../components/SetorMetricas.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useConfirm } from '../contexts/ConfirmContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function SetorDetalhe() {
  const { setorId } = useParams();
  const [setor, setSetor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: '', descricao: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const { can, isAdmin, papelEm } = useAuth();

  const load = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      setSetor(await apiSetores.obter(setorId));
    } catch {
      toast('Erro ao carregar setor.', 'error');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { load({ showLoading: true }); }, [setorId]);

  const openEdit = p => {
    setEditando(p);
    setForm({ titulo: p.titulo, descricao: p.descricao ?? '' });
  };

  const saveEdit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiProcessos.atualizar(editando.id, form);
      toast('Processo atualizado!');
      setEditando(null);
      load();
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao atualizar processo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async p => {
    const ok = await confirm(
      `Excluir "${p.titulo}" e todas as suas etapas?`,
      'Excluir processo',
    );
    if (!ok) return;
    try {
      await apiProcessos.remover(p.id);
      toast('Processo excluído.');
      load();
    } catch {
      toast('Erro ao excluir processo.', 'error');
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-48 rounded bg-slate-200" />
      <div className="card p-6 space-y-3">
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  );

  if (!setor) return <p className="text-red-600">Setor não encontrado.</p>;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Setores', to: '/' }, { label: setor.nome }]} />

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{setor.nome}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {setor.descricao || 'Sem descrição para este setor.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge">{setor.processos?.length ?? 0} processos</span>
            <span className="badge">{setor.campos?.length ?? 0} campos</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {papelEm(setor.id) && (
            <span className="self-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Seu papel: <strong className="capitalize text-slate-800">{papelEm(setor.id)}</strong>
            </span>
          )}
          {isAdmin && (
            <Link
              to={`/setores/${setor.id}/campos`}
              className="btn-ghost border border-slate-200"
            >
              Campos do formulário
            </Link>
          )}
          <Can action="processo.criar" setor={setor.id}>
            <Link to={`/setores/${setor.id}/processos/novo`} className="btn-primary">
              + Novo processo
            </Link>
          </Can>
        </div>
      </div>

      {/* Dashboard de indicadores */}
      <div className="mb-8">
        <SetorMetricas setorId={setor.id} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Processos do setor</h3>
      </div>

      {/* Empty */}
      {(!setor.processos || setor.processos.length === 0) ? (
        <div className="card flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            📋
          </div>
          <p className="font-semibold text-slate-700">Nenhum processo cadastrado</p>
          <p className="mt-1 text-sm text-slate-400">
            Crie o primeiro processo para este setor.
          </p>
          <Link
            to={`/setores/${setor.id}/processos/novo`}
            className="btn-primary mt-5"
          >
            + Novo processo
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {setor.processos.map(p => {
            const total = p.etapas_count ?? 0;

            return (
              <div
                key={p.id}
                className="card card-hover relative flex flex-col overflow-hidden p-0 border-brand-100/80"
              >
                <div className="h-1.5 w-full bg-brand-600" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="badge-gray shrink-0">{total} {total === 1 ? 'etapa' : 'etapas'}</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 line-clamp-2">{p.titulo}</h4>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-lg text-brand-700">
                      📋
                    </div>
                  </div>

                  <p className="min-h-[3rem] flex-1 text-sm leading-6 text-slate-500 line-clamp-3">
                    {p.descricao || 'Sem descrição.'}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Link
                      to={`/processos/${p.id}`}
                      className="btn-primary px-3 py-1.5 text-xs"
                      onMouseEnter={() => { void apiProcessos.obter(p.id); }}
                    >
                      Abrir
                    </Link>
                    <Can action="processo.editar" setor={setor.id}>
                      <button
                        className="btn-ghost px-3 py-1.5 text-xs"
                        onClick={() => openEdit(p)}
                      >
                        Editar
                      </button>
                    </Can>
                    <Can action="processo.excluir" setor={setor.id}>
                      <button
                        className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => del(p)}
                      >
                        Excluir
                      </button>
                    </Can>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit processo modal */}
      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title="Editar processo"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditando(null)}>
              Cancelar
            </button>
            <button className="btn-primary" form="edit-processo-form" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }
      >
        <form id="edit-processo-form" onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input
              className="input"
              required
              autoFocus
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
