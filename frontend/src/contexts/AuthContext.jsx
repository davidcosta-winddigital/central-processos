import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth as authApi } from '../api/client.js';

const Ctx = createContext(null);

const HIERARQUIA = { viewer: 1, editor: 2, manager: 3, admin: 4 };

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? readStoredUser() : null;
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = readStoredUser();
    return Boolean(token && !storedUser);
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || user) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then(currentUser => {
        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authApi.me();
      localStorage.setItem('user', JSON.stringify(fresh));
      setUser(fresh);
    } catch {}
  }, []);

  const isAdmin = user?.role === 'admin' || user?.is_admin;

  const papelEm = useCallback(setorId => {
    if (!user) return null;
    if (isAdmin) return 'admin';
    const s = (user.setores ?? []).find(x => Number(x.id) === Number(setorId));
    return s?.papel ?? null;
  }, [user, isAdmin]);

  const papelTemNivel = useCallback((setorId, minimo) => {
    const papel = papelEm(setorId);
    if (!papel) return false;
    return (HIERARQUIA[papel] ?? 0) >= (HIERARQUIA[minimo] ?? 99);
  }, [papelEm]);

  const canAccessSetor = useCallback(id => {
    if (!user) return false;
    if (isAdmin) return true;
    return papelEm(id) !== null;
  }, [user, isAdmin, papelEm]);

  const can = useCallback((action, setorId) => {
    if (!user) return false;
    if (isAdmin) return true;
    switch (action) {
      case 'setor.ver':
        return canAccessSetor(setorId);
      case 'setor.gerir':
      case 'campos.gerir':
      case 'usuarios.gerir':
        return false;
      case 'processo.criar':
      case 'processo.editar':
        return papelTemNivel(setorId, 'editor');
      case 'processo.excluir':
      case 'processo.aprovar':
        return papelTemNivel(setorId, 'manager');
      default:
        return false;
    }
  }, [user, isAdmin, canAccessSetor, papelTemNivel]);

  return (
    <Ctx.Provider value={{
      user, loading, login, logout, isAdmin, refreshUser,
      canAccessSetor, papelEm, papelTemNivel, can,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
