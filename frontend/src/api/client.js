import axios from 'axios';
import { COMM } from '../comunicacao.js';

// Endpoint da API conforme o ambiente (local x produção) — ver comunicacao.js
const baseURL = import.meta.env.VITE_API_URL || COMM.apiUrl;

// ── Cache em memória para GETs (TTL de 30 segundos) ──────────────────────────
const cache = new Map(); // key -> { data, expiresAt }
const inflight = new Map(); // key -> Promise<data>
const CACHE_TTL = 30_000;

function cacheGet(url) {
  const entry = cache.get(url);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  return null;
}
function cacheSet(url, data) {
  cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL });
}
export function cacheInvalidate(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

export function cacheClear() {
  cache.clear();
  inflight.clear();
}

function cachedGet(url) {
  const hit = cacheGet(url);
  if (hit) return Promise.resolve(hit);

  const pending = inflight.get(url);
  if (pending) return pending;

  const request = api
    .get(url)
    .then(r => {
      cacheSet(url, r.data);
      return r.data;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, request);
  return request;
}

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Injetar token salvo antes de cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirecionar para login em 401
api.interceptors.response.use(
  r => r,
  error => {
    if (error.response?.status === 401) {
      cacheClear();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const perfil = {
  obter:       ()        => cachedGet('/perfil'),
  atualizar:   data      => api.put('/perfil', data).then(r => { cacheInvalidate('/perfil'); cacheInvalidate('/auth/me'); return r.data; }),
  uploadAvatar: file => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post('/perfil/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => { cacheInvalidate('/perfil'); cacheInvalidate('/auth/me'); return r.data; });
  },
  removerAvatar: () => api.delete('/perfil/avatar').then(r => { cacheInvalidate('/perfil'); cacheInvalidate('/auth/me'); return r.data; }),
};

export const auth = {
  login:  data => api.post('/auth/login', data).then(r => {
    cacheClear();
    return r.data;
  }),
  // Etapa 1 do cadastro: valida domínio e envia o código por e-mail.
  register:       data => api.post('/auth/register', data).then(r => r.data),
  // Etapa 2: valida o código e cria a conta (retorna token + user).
  registerVerify: data => api.post('/auth/register/verify', data).then(r => {
    cacheClear();
    return r.data;
  }),
  me:     ()   => cachedGet('/auth/me'),
  logout: ()   => api.post('/auth/logout').then(r => {
    cacheClear();
    return r.data;
  }),
};

export const infra = {
  // Carga inicial do dashboard (sem cache — os dados mudam a cada segundo).
  metricas: () => api.get('/infra/metricas').then(r => r.data),
  // CRUD de servidores
  listar:         ()        => api.get('/infra/servidores').then(r => r.data),
  criar:          data      => api.post('/infra/servidores', data).then(r => r.data),
  atualizar:      (id, data)=> api.put(`/infra/servidores/${id}`, data).then(r => r.data),
  remover:        id        => api.delete(`/infra/servidores/${id}`).then(r => r),
  regenerarToken: id        => api.post(`/infra/servidores/${id}/token`).then(r => r.data),
  servidor:       id        => api.get(`/infra/servidores/${id}`).then(r => r.data),
  observacoes: {
    listar:  sid          => api.get(`/infra/servidores/${sid}/observacoes`).then(r => r.data),
    criar:   (sid, texto) => api.post(`/infra/servidores/${sid}/observacoes`, { texto }).then(r => r.data),
    remover: id           => api.delete(`/infra/observacoes/${id}`).then(r => r),
  },
};

export const users = {
  listar:        ()          => cachedGet('/users'),
  criar:         data        => api.post('/users', data).then(r => { cacheInvalidate('/users'); return r.data; }),
  atualizar:     (id, data)  => api.put(`/users/${id}`, data).then(r => { cacheInvalidate('/users'); return r.data; }),
  remover:       id          => api.delete(`/users/${id}`).then(r => { cacheInvalidate('/users'); return r; }),
  updateSetores: (id, payload) => {
    // payload pode ser array de ids (legado) ou array de { setor_id, papel }
    const isObjArray = Array.isArray(payload) && payload.length > 0 && typeof payload[0] === 'object';
    const body = isObjArray ? { setores: payload } : { setor_ids: payload };
    return api.put(`/users/${id}/setores`, body).then(r => { cacheInvalidate('/users'); return r.data; });
  },
};

export const setores = {
  listar:   ()         => cachedGet('/setores'),
  obter:    id         => cachedGet(`/setores/${id}`),
  metricas: id         => cachedGet(`/setores/${id}/metricas`),
  criar:    data       => api.post('/setores', data).then(r => { cacheInvalidate('/setores'); return r.data; }),
  atualizar:(id, data) => api.put(`/setores/${id}`, data).then(r => { cacheInvalidate('/setores'); return r.data; }),
  remover:  id         => api.delete(`/setores/${id}`).then(r => { cacheInvalidate('/setores'); return r; }),
};

export const campos = {
  listar:   setorId        => cachedGet(`/setores/${setorId}/campos`),
  criar:    (setorId, data)=> api.post(`/setores/${setorId}/campos`, data).then(r => { cacheInvalidate(`/setores/${setorId}`); return r.data; }),
  atualizar:(id, data)     => api.put(`/campos/${id}`, data).then(r => { cacheInvalidate('/setores'); return r.data; }),
  remover:  id             => api.delete(`/campos/${id}`).then(r => { cacheInvalidate('/setores'); return r; }),
};

export const campoPermissoes = {
  listar:    campoId      => api.get(`/campos/${campoId}/permissoes`).then(r => r.data),
  atualizar: (campoId, permissoes) => api.put(`/campos/${campoId}/permissoes`, { permissoes }).then(r => r.data),
};

export const processos = {
  listar:   setorId        => cachedGet(`/setores/${setorId}/processos`),
  obter:    id             => cachedGet(`/processos/${id}`),
  criar:    (setorId, data)=> api.post(`/setores/${setorId}/processos`, data).then(r => { cacheInvalidate(`/setores/${setorId}`); cacheInvalidate(`/processos`); return r.data; }),
  atualizar:(id, data)     => api.put(`/processos/${id}`, data).then(r => { cacheInvalidate(`/processos/${id}`); cacheInvalidate('/setores'); return r.data; }),
  remover:  id             => api.delete(`/processos/${id}`).then(r => { cacheInvalidate('/processos'); cacheInvalidate('/setores'); return r; }),
};

export const processoCampos = {
  listar:   processoId     => cachedGet(`/processos/${processoId}/campos-processo`),
  criar:    (pId, data)    => api.post(`/processos/${pId}/campos-processo`, data).then(r => { cacheInvalidate(`/processos/${pId}`); return r.data; }),
  atualizar:(id, data)     => api.put(`/campos-processo/${id}`, data).then(r => { cacheInvalidate('/processos'); return r.data; }),
  remover:  id             => api.delete(`/campos-processo/${id}`).then(r => { cacheInvalidate('/processos'); return r; }),
};

export const etapas = {
  criar:    (processoId, data) => api.post(`/processos/${processoId}/etapas`, data).then(r => { cacheInvalidate(`/processos/${processoId}`); cacheInvalidate('/setores'); return r.data; }),
  atualizar:(id, data)         => api.put(`/etapas/${id}`, data).then(r => { cacheInvalidate('/processos'); cacheInvalidate('/setores'); return r.data; }),
  remover:  id                 => api.delete(`/etapas/${id}`).then(r => { cacheInvalidate('/processos'); cacheInvalidate('/setores'); return r; }),
};

export const anexos = {
  listarEtapa: etapaId => api.get(`/etapas/${etapaId}/anexos`).then(r => r.data),
  uploadEtapa: (etapaId, formData) => api.post(`/etapas/${etapaId}/anexos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => { cacheInvalidate('/processos'); return r.data; }),
  removerEtapa: id => api.delete(`/etapa-anexos/${id}`).then(r => { cacheInvalidate('/processos'); return r; }),
};
