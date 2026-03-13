/**
 * Serviço de API centralizado.
 * Todas as chamadas ao backend passam por aqui.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redireciona para login em caso de 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
}

// ─────────────────────────────────────────────────────────────
// LOCALIZAÇÃO
// ─────────────────────────────────────────────────────────────
export const localizacaoService = {
  getContinentes: () => api.get('/api/localizacao/continentes'),
  getPaises: (continente_id) =>
    api.get('/api/localizacao/paises', { params: { continente_id } }),
  getEstados: (pais_id) =>
    api.get('/api/localizacao/estados', { params: { pais_id } }),
  getMunicipios: (estado_id) =>
    api.get('/api/localizacao/municipios', { params: { estado_id } }),
  getBairros: (municipio_id) =>
    api.get('/api/localizacao/bairros', { params: { municipio_id } }),

  criarContinente: (data) => api.post('/api/localizacao/continentes', data),
  criarPais: (data) => api.post('/api/localizacao/paises', data),
  criarEstado: (data) => api.post('/api/localizacao/estados', data),
  criarMunicipio: (data) => api.post('/api/localizacao/municipios', data),
  criarBairro: (data) => api.post('/api/localizacao/bairros', data),
}

// ─────────────────────────────────────────────────────────────
// TIMES
// ─────────────────────────────────────────────────────────────
export const timesService = {
  listar: (params) => api.get('/api/times/', { params }),
  obter: (id) => api.get(`/api/times/${id}`),
  criar: (data) => api.post('/api/times/', data),
  atualizar: (id, data) => api.put(`/api/times/${id}`, data),
  deletar: (id) => api.delete(`/api/times/${id}`),
}

// ─────────────────────────────────────────────────────────────
// CAMPEONATOS
// ─────────────────────────────────────────────────────────────
export const campeonatosService = {
  listar: (params) => api.get('/api/campeonatos/', { params }),
  obter: (id) => api.get(`/api/campeonatos/${id}`),
  criar: (data) => api.post('/api/campeonatos/', data),
  atualizar: (id, data) => api.put(`/api/campeonatos/${id}`, data),
  inscreverTime: (campId, timeId) =>
    api.post(`/api/campeonatos/${campId}/times/${timeId}`),
  removerTime: (campId, timeId) =>
    api.delete(`/api/campeonatos/${campId}/times/${timeId}`),
}

// ─────────────────────────────────────────────────────────────
// PARTIDAS
// ─────────────────────────────────────────────────────────────
export const partidasService = {
  listar: (params) => api.get('/api/partidas/', { params }),
  obter: (id) => api.get(`/api/partidas/${id}`),
  criar: (data) => api.post('/api/partidas/', data),
  registrarPlacar: (id, data) => api.patch(`/api/partidas/${id}/placar`, data),
  atualizar: (id, data) => api.put(`/api/partidas/${id}`, data),
  deletar: (id) => api.delete(`/api/partidas/${id}`),
}

// ─────────────────────────────────────────────────────────────
// CLASSIFICAÇÃO
// ─────────────────────────────────────────────────────────────
export const classificacaoService = {
  campeonato: (id) => api.get(`/api/classificacao/campeonato/${id}`),
  ranking: (params) => api.get('/api/classificacao/ranking', { params }),
  melhorPorNivel: () => api.get('/api/classificacao/melhor-por-nivel'),
}

export default api
