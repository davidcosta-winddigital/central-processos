import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { setores as apiSetores } from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useConfirm } from '../contexts/ConfirmContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function Dashboard() {
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nome: '', descricao: '' });
  const [saving, setSaving] = useState(false);
  const toast   = useToast();
  const confirm = useConfirm();
  const { isAdmin } = useAuth();

  const load = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      setSetores(await apiSetores.listar());
    } catch {
      toast('Erro ao carregar setores.', 'error');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { load({ showLoading: true }); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ nome: '', descricao: '' });
    setModalOpen(true);
  };

  const openEdit = s => {
    setEditing(s);
    setForm({ nome: s.nome, descricao: s.descricao ?? '' });
    setModalOpen(true);
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiSetores.atualizar(editing.id, form);
        toast('Setor atualizado com sucesso!');
      } else {
        await apiSetores.criar(form);
        toast('Setor criado com sucesso!');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao salvar setor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async s => {
    const ok = await confirm(
      `Excluir "${s.nome}" e todos os seus processos e campos?`,
      'Excluir setor',
    );
    if (!ok) return;
    try {
      await apiSetores.remover(s.id);
      toast('Setor excluído.');
      load();
    } catch {
      toast('Erro ao excluir setor.', 'error');
    }
  };

  const totalProcessos = setores.reduce((acc, s) => acc + (s.processos_count ?? 0), 0);
  const totalCampos = setores.reduce((acc, s) => acc + (s.campos_count ?? 0), 0);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Setores</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie os setores e seus processos de onboarding.
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openNew}>
            + Novo setor
          </button>
        )}
      </div>

      {/* Stats */}
      {!loading && setores.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Setores ativos', value: setores.length, icon: '🏢', cor: 'from-brand-500/10 to-brand-600/5 text-brand-700 border-brand-100' },
            { label: 'Total de processos', value: totalProcessos, icon: '📋', cor: 'from-emerald-500/10 to-emerald-600/5 text-emerald-700 border-emerald-100' },
            { label: 'Campos cadastrados', value: totalCampos, icon: '🗂️', cor: 'from-amber-500/10 to-amber-600/5 text-amber-700 border-amber-100' },
            { label: 'Média p/ setor', value: setores.length ? Math.round(totalProcessos / setores.length) : 0, icon: '📊', cor: 'from-violet-500/10 to-violet-600/5 text-violet-700 border-violet-100' },
          ].map(stat => (
            <div key={stat.label} className={`card border bg-gradient-to-br ${stat.cor} p-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-extrabold leading-none tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">{stat.label}</p>
                </div>
                <span className="text-2xl opacity-70">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-5 w-16 rounded-full bg-slate-100" />
              </div>
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-3/4 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && setores.length === 0 && (
        <div className="card flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            📁
          </div>
          <p className="font-semibold text-slate-700">Nenhum setor disponível</p>
          <p className="mt-1 text-sm text-slate-400">
            {isAdmin ? 'Comece criando o primeiro setor.' : 'Você ainda não tem acesso a nenhum setor.'}
          </p>
          {isAdmin && (
            <button className="btn-primary mt-5" onClick={openNew}>
              + Criar setor
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {setores.map(s => (
          <div
            key={s.id}
            className="card flex flex-col p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold leading-tight text-slate-900">
                {s.nome}
              </h3>
              <span className="badge shrink-0">{s.processos_count ?? 0} proc.</span>
            </div>
            <p className="min-h-[2.5rem] flex-1 text-sm text-slate-500 line-clamp-2">
              {s.descricao || 'Sem descrição.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Link
                to={`/setores/${s.id}`}
                className="btn-primary px-3 py-1.5 text-xs"
                onMouseEnter={() => { void apiSetores.obter(s.id); }}
              >
                Explorar
              </Link>
              {s.papel && !isAdmin && (
                <span
                  className="self-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
                  title={`Seu papel neste setor: ${s.papel}`}
                >
                  {s.papel}
                </span>
              )}
              {isAdmin && (
                <>
                  <Link to={`/setores/${s.id}/campos`} className="btn-ghost px-3 py-1.5 text-xs">
                    Campos
                  </Link>
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => openEdit(s)}>
                    Editar
                  </button>
                  <button
                    className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => del(s)}
                  >
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar setor' : 'Novo setor'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn-primary" form="setor-form" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }
      >
        <form id="setor-form" onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input
              className="input"
              required
              autoFocus
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input min-h-[90px] resize-none"
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
