import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { setores as apiSetores } from '../api/client.js';
import Logo from './Logo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

function Icon({ name }) {
  const map = {
    dashboard: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
    setores: 'M3 7h18M3 12h18M3 17h18',
    usuarios: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    perfil: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    sair: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    logo: 'M3 3h18v18H3zM3 9h18M9 21V9',
    chevronDown: 'M6 9l6 6 6-6',
    notificacao: 'M18 8a6 6 0 0 0-9.33-5M6 8a6 6 0 0 0 0 8v3l-2 2h16l-2-2v-3a6 6 0 0 0-6-6',
    busca: 'M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
      <path d={map[name] ?? map.logo} />
    </svg>
  );
}

function NavItem({ to, icon, label, end = false, active = false }) {
  const cls = active
    ? 'bg-brand-700/40 text-white border-l-2 border-brand-400'
    : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent';

  if (active && !to) {
    return (
      <div className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium ${cls}`}>
        <Icon name={icon} />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors border-l-2 ${
          isActive
            ? 'bg-brand-700/40 text-white border-brand-400'
            : 'text-slate-300 hover:bg-white/5 hover:text-white border-transparent'
        }`
      }
    >
      <Icon name={icon} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="px-5 mt-5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
      {children}
    </p>
  );
}

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [setores, setSetores] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    apiSetores.listar().then(setSetores).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    toast('Sessão encerrada.', 'success');
    navigate('/login');
  };

  const avatarSrc = user?.avatar_url ?? null;
  const inicial = (user?.name ?? '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0f172a] text-slate-200 transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-10 w-10 shrink-0" />
            {sidebarOpen && (
              <div className="leading-tight">
                <p className="text-sm font-extrabold tracking-tight text-white">central</p>
                <p className="-mt-0.5 text-[10px] uppercase tracking-widest text-slate-500">processos</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="hidden lg:block rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white"
            aria-label="Recolher sidebar"
          >
            ←
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-2">
          <SectionTitle>Navegação</SectionTitle>
          <NavItem to="/" end icon="dashboard" label="Dashboard" />
          <NavItem to="/perfil" icon="perfil" label="Meu perfil" />
          {isAdmin && <NavItem to="/admin/usuarios" icon="usuarios" label="Usuários" />}

          {setores.length > 0 && (
            <>
              <SectionTitle>Setores</SectionTitle>
              {setores.map(s => (
                <NavLink
                  key={s.id}
                  to={`/setores/${s.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-2 text-sm font-medium transition-colors border-l-2 ${
                      isActive
                        ? 'bg-brand-700/40 text-white border-brand-400'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border-transparent'
                    }`
                  }
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-white/5 text-[11px] font-bold">
                    {s.nome.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate flex-1">{s.nome}</span>
                  {s.processos_count > 0 && (
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold">
                      {s.processos_count}
                    </span>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer da sidebar */}
        <div className="border-t border-white/5 px-5 py-3 text-[10px] text-slate-500">
          <p>v1.0 &middot; {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className={`flex flex-1 flex-col transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Buscar">
              <Icon name="busca" />
            </button>
          </div>

          {/* Avatar / menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-bold text-white shadow">
                  {inicial}
                </div>
              )}
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[11px] capitalize text-slate-500">
                  {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </p>
              </div>
              <Icon name="chevronDown" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                    <p className="truncate font-semibold text-slate-700">{user?.name}</p>
                    <p className="truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/perfil"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Icon name="perfil" /> Meu perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <Icon name="sair" /> Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-xs text-slate-400">
          Central de Processos &middot; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
