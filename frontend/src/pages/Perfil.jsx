import { useEffect, useRef, useState } from 'react';
import { perfil as apiPerfil } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function Perfil() {
  const { user: authUser } = useAuth();
  const toast = useToast();
  const fileInput = useRef(null);

  const [me, setMe] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', cargo: '', telefone: '',
  });
  const [senhaForm, setSenhaForm] = useState({
    senha_atual: '', nova_senha: '', nova_senha_confirmation: '',
  });

  const load = async () => {
    try {
      const data = await apiPerfil.obter();
      setMe(data);
      setForm({
        name: data.name ?? '',
        email: data.email ?? '',
        cargo: data.cargo ?? '',
        telefone: data.telefone ?? '',
      });
    } catch {
      toast('Erro ao carregar perfil.', 'error');
    }
  };

  useEffect(() => { load(); }, []);

  const salvar = async e => {
    e.preventDefault();
    setSalvando(true);
    try {
      const updated = await apiPerfil.atualizar(form);
      setMe(updated);
      // Atualiza localStorage para refletir nas outras telas
      const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...updated }));
      toast('Perfil atualizado!');
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao atualizar perfil.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const trocarSenha = async e => {
    e.preventDefault();
    setTrocandoSenha(true);
    try {
      await apiPerfil.atualizar(senhaForm);
      setSenhaForm({ senha_atual: '', nova_senha: '', nova_senha_confirmation: '' });
      toast('Senha atualizada!');
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao trocar senha.', 'error');
    } finally {
      setTrocandoSenha(false);
    }
  };

  const onPickFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast('Imagem maior que 4MB.', 'error');
      return;
    }
    try {
      const updated = await apiPerfil.uploadAvatar(file);
      setMe(updated);
      const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...updated }));
      toast('Foto atualizada!');
      // recarrega a página para o Layout pegar o novo avatar
      window.location.reload();
    } catch {
      toast('Erro ao enviar imagem.', 'error');
    }
  };

  const removerAvatar = async () => {
    try {
      const updated = await apiPerfil.removerAvatar();
      setMe(updated);
      const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...updated }));
      toast('Foto removida.');
      window.location.reload();
    } catch {
      toast('Erro ao remover foto.', 'error');
    }
  };

  if (!me) return <div className="card p-6 animate-pulse h-32" />;

  const inicial = (me.name ?? '?').charAt(0).toUpperCase();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Meu perfil</h2>
        <p className="mt-1 text-sm text-slate-500">Gerencie seus dados pessoais e foto.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card com foto */}
        <div className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-brand-500 to-brand-700" />
          <div className="-mt-12 flex flex-col items-center px-6 pb-6 text-center">
            {me.avatar_url ? (
              <img
                src={me.avatar_url}
                alt={me.name}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-brand-400 to-brand-700 text-3xl font-bold text-white shadow-lg">
                {inicial}
              </div>
            )}
            <h3 className="mt-3 text-lg font-bold text-slate-900">{me.name}</h3>
            <p className="text-sm text-slate-500">{me.email}</p>
            {me.cargo && <p className="mt-1 text-xs text-slate-400">{me.cargo}</p>}
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
                me.is_admin ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {me.is_admin ? 'Administrador' : 'Usuário'}
            </span>

            <div className="mt-5 flex flex-col gap-2 w-full">
              <input
                type="file" accept="image/*" className="hidden" ref={fileInput}
                onChange={onPickFile}
              />
              <button className="btn-primary" onClick={() => fileInput.current?.click()}>
                📷 Alterar foto
              </button>
              {me.avatar_url && (
                <button className="btn-ghost text-red-600" onClick={removerAvatar}>
                  Remover foto
                </button>
              )}
            </div>

            <p className="mt-4 text-[10px] text-slate-400">
              JPG, PNG ou WebP &middot; até 4MB
            </p>
          </div>
        </div>

        {/* Formulários */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={salvar} className="card p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Dados pessoais</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nome *</label>
                <input
                  className="input" required
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
                <label className="label">Cargo</label>
                <input
                  className="input" placeholder="Ex.: Analista de Processos"
                  value={form.cargo}
                  onChange={e => setForm({ ...form, cargo: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input
                  className="input" placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button className="btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>

          <form onSubmit={trocarSenha} className="card p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Alterar senha</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Senha atual</label>
                <input
                  type="password" className="input"
                  value={senhaForm.senha_atual}
                  onChange={e => setSenhaForm({ ...senhaForm, senha_atual: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Nova senha</label>
                <input
                  type="password" className="input" minLength={6}
                  value={senhaForm.nova_senha}
                  onChange={e => setSenhaForm({ ...senhaForm, nova_senha: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Confirmar nova senha</label>
                <input
                  type="password" className="input" minLength={6}
                  value={senhaForm.nova_senha_confirmation}
                  onChange={e => setSenhaForm({ ...senhaForm, nova_senha_confirmation: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                className="btn-primary"
                disabled={trocandoSenha || !senhaForm.nova_senha || senhaForm.nova_senha !== senhaForm.nova_senha_confirmation}
              >
                {trocandoSenha ? 'Atualizando...' : 'Atualizar senha'}
              </button>
            </div>
          </form>

          {/* Setores */}
          {me.setores?.length > 0 && (
            <div className="card p-6">
              <h3 className="mb-3 text-base font-semibold text-slate-900">Meus setores</h3>
              <div className="flex flex-wrap gap-2">
                {me.setores.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs"
                  >
                    <span className="font-semibold text-slate-700">{s.nome}</span>
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase font-bold text-slate-500">
                      {s.papel}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
