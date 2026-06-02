import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth as authApi } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Cadastro() {
  const { aplicarSessao } = useAuth();
  const navigate = useNavigate();

  const [etapa, setEtapa]     = useState(1); // 1 = dados, 2 = código
  const [form, setForm]       = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [codigo, setCodigo]   = useState('');
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  // Etapa 1 — envia os dados e dispara o código por e-mail
  const enviarDados = async e => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (form.password !== form.password_confirmation) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(form);
      setInfo(res.message ?? 'Código enviado para o seu e-mail.');
      setEtapa(2);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Não foi possível iniciar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2 — valida o código e cria a conta (login automático)
  const validarCodigo = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.registerVerify({ email: form.email, codigo });
      aplicarSessao(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await authApi.register(form);
      setInfo(res.message ?? 'Novo código enviado.');
      setCodigo('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Não foi possível reenviar o código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-lg">
            CP
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
          <p className="mt-1 text-sm text-slate-500">
            {etapa === 1
              ? 'Use seu e-mail corporativo (@winddigital.com.br ou @prolicitante.com.br)'
              : `Digite o código enviado para ${form.email}`}
          </p>
        </div>

        <div className="card p-6">
          {info && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {info}
            </p>
          )}
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {etapa === 1 ? (
            <form onSubmit={enviarDados} className="space-y-4">
              <div>
                <label className="label">Nome</label>
                <input
                  className="input"
                  autoFocus
                  required
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Senha</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Confirmar senha</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  value={form.password_confirmation}
                  onChange={e => setField('password_confirmation', e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Enviando código...' : 'Criar conta'}
              </button>
            </form>
          ) : (
            <form onSubmit={validarCodigo} className="space-y-4">
              <div>
                <label className="label">Código de verificação</label>
                <input
                  className="input text-center text-2xl tracking-[0.5em]"
                  autoFocus
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading || codigo.length < 6}>
                {loading ? 'Validando...' : 'Confirmar e entrar'}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={() => { setEtapa(1); setError(''); setInfo(''); }}
                >
                  ← Alterar dados
                </button>
                <button
                  type="button"
                  className="font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50"
                  onClick={reenviar}
                  disabled={loading}
                >
                  Reenviar código
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
