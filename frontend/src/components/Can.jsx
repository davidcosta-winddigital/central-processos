import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Renderiza children apenas se o usuário tem a permissão.
 * Uso: <Can action="processo.editar" setor={setorId}>...</Can>
 */
export default function Can({ action, setor, fallback = null, children }) {
  const { can } = useAuth();
  return can(action, setor) ? <>{children}</> : fallback;
}
