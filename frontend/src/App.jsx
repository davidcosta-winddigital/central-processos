import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ConfirmProvider } from './contexts/ConfirmContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Infraestrutura from './pages/Infraestrutura.jsx';
import ServidorDetalhe from './pages/ServidorDetalhe.jsx';
import GerenciarCampos from './pages/GerenciarCampos.jsx';
import NovoProcesso from './pages/NovoProcesso.jsx';
import Perfil from './pages/Perfil.jsx';
import ProcessoDetalhe from './pages/ProcessoDetalhe.jsx';
import SetorDetalhe from './pages/SetorDetalhe.jsx';
import Usuarios from './pages/admin/Usuarios.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            {/* Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Cadastro />} />

            {/* Protegidas */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route
                        path="/infra"
                        element={
                          <ProtectedRoute infraOnly>
                            <Infraestrutura />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/infra/servidores/:id"
                        element={
                          <ProtectedRoute infraOnly>
                            <ServidorDetalhe />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/perfil" element={<Perfil />} />
                      <Route path="/setores/:setorId" element={<SetorDetalhe />} />
                      <Route path="/setores/:setorId/campos" element={<GerenciarCampos />} />
                      <Route path="/setores/:setorId/processos/novo" element={<NovoProcesso />} />
                      <Route path="/processos/:processoId" element={<ProcessoDetalhe />} />

                      {/* Admin */}
                      <Route
                        path="/admin/usuarios"
                        element={
                          <ProtectedRoute adminOnly>
                            <Usuarios />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="*"
                        element={
                          <div className="flex flex-col items-center py-24 text-center">
                            <p className="text-8xl font-bold text-slate-100">404</p>
                            <p className="mt-2 text-lg font-medium text-slate-600">Página não encontrada</p>
                            <Link to="/" className="mt-4 text-sm text-brand-600 underline">
                              Voltar ao início
                            </Link>
                          </div>
                        }
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
