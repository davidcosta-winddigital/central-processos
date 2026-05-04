import { useEffect, useState } from 'react';
import { setores as apiSetores, users as apiUsers } from '../../api/client.js';
import Modal from '../../components/Modal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

const USER_VAZIO = { name: '', email: '', password: '', role: 'user' };

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {role === 'admin' ? 'Administrador' : 'Usuário'}
    </span>
  );
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [setores, setSetores]   = useState([]);
  const [loading, setLoading]   = useState(true);

  // Modal único de criar/editar — inclui setores
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(USER_VAZIO);
  // { setorId: papel } — controla quais setores estão atribuídos
  const [setoresPapeis, setSetoresPapeis] = useState({});
  const [saving, setSaving]       = useState(false);

  const toast   = useToast();
  const confirm = useConfirm();
  const { user: me } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([apiUsers.listar(), apiSetores.listar()]);
      setUsuarios(u);
      setSetores(s);
    } catch {
      toast('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(USER_VAZIO);
    setSetoresPapeis({});
    setModalOpen(true);
  };

  const openEdit = u => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    const map = {};
    (u.setores ?? []).forEach(s => { map[s.id] = s.papel ?? 'viewer'; });
    setSetoresPapeis(map);
    setModalOpen(true);
  };

  const toggleSetor = id => {
    setSetoresPapeis(prev => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = 'viewer';
      return next;
    });
  };

  const setPapel = (id, papel) => {
    setSetoresPapeis(prev => ({ ...prev, [id]: papel }));
  };

  const selecionarTodos = () => {
    const map = {};
    setores.forEach(s => { map[s.id] = setoresPapeis[s.id] ?? 'viewer'; });
    setSetoresPapeis(map);
  };

  const limparSelecao = () => setSetoresPapeis({});

  const save = async e => {
    e.preventDefault();

    // Aviso suave: usuário comum sem setor não verá nada.
    if (form.role === 'user' && Object.keys(setoresPapeis).length === 0) {
      const ok = await confirm(
        'Este usuário não tem nenhum setor selecionado e não conseguirá ver nenhum setor no sistema. Deseja continuar mesmo assim?',
        'Sem setores atribuídos',
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;

      // Só envia setores se for usuário comum (admin tem acesso a tudo).
      if (form.role !== 'admin') {
        payload.setores = Object.entries(setoresPapeis).map(([id, papel]) => ({
          setor_id: Number(id),
          papel,
        }));
      } else {
        payload.setores = [];
      }

      if (editing) {
        await apiUsers.atualizar(editing.id, payload);
        toast('Usuário atualizado!');
      } else {
        await apiUsers.criar(payload);
        toast('Usuário criado!');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao salvar usuário.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async u => {
    const ok = await confirm(
      `Excluir o usuário "${u.name}"? Esta ação não pode ser desfeita.`,
      'Excluir usuário',
    );
    if (!ok) return;
    try {
      await apiUsers.remover(u.id);
      toast('Usuário excluído.');
      load();
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao excluir usuário.', 'error');
    }
  };

  const isAdminForm = form.role === 'admin';
  const totalSetoresSelecionados = Object.keys(setoresPapeis).length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Usuários</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie usuários e controle quais setores cada um pode acessar.
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Novo usuário</button>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-slate-200" />
                <div className="h-3 w-56 rounded bg-slate-100" />
              </div>
              <div className="h-5 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      {!loading && (
        <div className="card overflow-hidden">
          {usuarios.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                👤
              </div>
              <p className="font-semibold text-slate-700">Nenhum usuário cadastrado</p>
              <button className="btn-primary mt-4" onClick={openNew}>+ Criar primeiro usuário</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3 hidden sm:table-cell">E-mail</th>
                  <th className="px-5 py-3">Perfil</th>
                  <th className="px-5 py-3 hidden md:table-cell">Setores e papéis</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuarios.map(u => (
                  <tr key={u.id} className="group hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{u.name}</span>
                        {u.id === me?.id && (
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600">
                            você
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {u.role === 'admin' ? (
                        <span className="text-xs italic text-slate-400">Acesso total a todos os setores</span>
                      ) : (u.setores ?? []).length === 0 ? (
                        <span className="text-xs italic text-rose-500">⚠ Sem setores atribuídos</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(u.setores ?? []).map(s => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                              title={`Papel: ${s.papel ?? 'viewer'}`}
                            >
                              {s.nome}
                              <span className="rounded bg-white px-1 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                                {s.papel ?? 'viewer'}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => openEdit(u)}>
                          Editar
                        </button>
                        {u.id !== me?.id && (
                          <button
                            className="btn-ghost px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => del(u)}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal único: criar/editar usuário (com setores) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        size="lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn-primary" form="user-form" disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar usuário'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={save} className="space-y-5">
          {/* Dados básicos */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nome *</label>
              <input
                className="input" required autoFocus
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input
                type="email" className="input" required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                Senha {editing && <span className="text-slate-400 font-normal">(em branco mantém)</span>}
                {!editing && ' *'}
              </label>
              <input
                type="password" className="input"
                required={!editing}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Perfil *</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors ${
                    form.role === 'user' ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio" name="role" value="user" checked={form.role === 'user'}
                    onChange={() => setForm({ ...form, role: 'user' })}
                    className="mt-0.5"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">Usuário</p>
                    <p className="text-xs text-slate-500">Vê apenas os setores que você selecionar abaixo.</p>
                  </div>
                </label>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors ${
                    form.role === 'admin' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio" name="role" value="admin" checked={form.role === 'admin'}
                    onChange={() => setForm({ ...form, role: 'admin' })}
                    className="mt-0.5"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">Administrador</p>
                    <p className="text-xs text-slate-500">Acesso total a todos os setores e configurações.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Setores e papéis (apenas para usuário comum) */}
          {!isAdminForm && (
            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="-ml-1 px-1 text-sm font-semibold text-slate-700">
                Setores que o usuário pode acessar
                <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                  {totalSetoresSelecionados}
                </span>
              </legend>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="text-slate-500">
                  Marque os setores e defina o papel em cada um.
                </p>
                <div className="flex gap-1">
                  <button type="button" className="rounded px-2 py-1 text-xs text-brand-700 hover:bg-brand-50" onClick={selecionarTodos}>
                    Selecionar todos
                  </button>
                  <button type="button" className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" onClick={limparSelecao}>
                    Limpar
                  </button>
                </div>
              </div>

              <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <strong>viewer</strong>: só visualiza · <strong>editor</strong>: cria e edita processos · <strong>manager</strong>: também aprova e exclui · <strong>admin</strong>: gerencia o setor inteiro
              </div>

              {setores.length === 0 ? (
                <p className="py-6 text-center text-sm italic text-slate-400">Nenhum setor cadastrado ainda.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {setores.map(s => {
                    const ativo = s.id in setoresPapeis;
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
                          ativo ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          checked={ativo}
                          onChange={() => toggleSetor(s.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{s.nome}</p>
                          {s.descricao && (
                            <p className="truncate text-xs text-slate-400">{s.descricao}</p>
                          )}
                        </div>
                        {ativo && (
                          <select
                            className="input w-32 py-1 text-xs"
                            value={setoresPapeis[s.id]}
                            onChange={e => setPapel(s.id, e.target.value)}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin (setor)</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {totalSetoresSelecionados === 0 && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  ⚠ Sem setores selecionados, este usuário não verá nenhum setor no sistema.
                </p>
              )}
            </fieldset>
          )}

          {isAdminForm && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              ✨ Administradores têm acesso a <strong>todos os setores</strong> automaticamente.
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
