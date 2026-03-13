import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { campeonatosService } from '../services/api'
import { Plus, Trophy, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const NIVEL_INFO = {
  bairro:     { label: 'Bairro',     cls: 'nivel-bairro' },
  municipio:  { label: 'Município',  cls: 'nivel-municipio' },
  estado:     { label: 'Estado',     cls: 'nivel-estado' },
  pais:       { label: 'País',       cls: 'nivel-pais' },
  continente: { label: 'Continente', cls: 'nivel-continente' },
}

const STATUS_INFO = {
  planejado:     { label: 'Planejado',     cls: 'badge-gray' },
  em_andamento:  { label: 'Em Andamento',  cls: 'badge-green' },
  finalizado:    { label: 'Finalizado',    cls: 'badge-blue' },
}

export default function CampeonatosPage() {
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtroNivel) params.nivel = filtroNivel
      if (filtroStatus) params.status = filtroStatus
      const res = await campeonatosService.listar(params)
      setCamps(res.data)
    } catch {
      toast.error('Erro ao carregar campeonatos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filtroNivel, filtroStatus])

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Campeonatos</h2>
          <p>{camps.length} campeonatos encontrados</p>
        </div>
        <Link to="/campeonatos/novo" className="btn btn-primary">
          <Plus size={16} /> Criar Campeonato
        </Link>
      </div>

      <div className="page-body">
        {/* Filtros */}
        <div className="filter-bar">
          <select className="form-select" value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}>
            <option value="">Todos os Níveis</option>
            {Object.entries(NIVEL_INFO).map(([v, i]) => (
              <option key={v} value={v}>{i.label}</option>
            ))}
          </select>
          <select className="form-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos os Status</option>
            {Object.entries(STATUS_INFO).map(([v, i]) => (
              <option key={v} value={v}>{i.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : camps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>Nenhum campeonato encontrado</h3>
            <p>Crie seu primeiro campeonato!</p>
            <Link to="/campeonatos/novo" className="btn btn-primary">Criar Campeonato</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {camps.map((c) => {
              const nivel = NIVEL_INFO[c.nivel] || { label: c.nivel, cls: 'badge-gray' }
              const status = STATUS_INFO[c.status] || { label: c.status, cls: 'badge-gray' }
              const timeCount = c.campeonato_times?.length || 0

              return (
                <div key={c.id} className="card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span className={`badge ${nivel.cls}`}>{nivel.label}</span>
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'var(--gray-700)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                    }}>🏆</div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-100)' }}>{c.nome}</h3>
                      <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                        {timeCount} time{timeCount !== 1 ? 's' : ''} inscritos
                      </p>
                    </div>
                  </div>

                  {(c.data_inicio || c.data_fim) && (
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--gray-400)', marginBottom: 12 }}>
                      {c.data_inicio && (
                        <span>
                          <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                          {new Date(c.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {c.data_fim && (
                        <span>→ {new Date(c.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                      to={`/classificacao?campeonato=${c.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Ver Classificação
                    </Link>
                    <Link
                      to={`/partidas?campeonato=${c.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Partidas
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
