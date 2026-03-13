import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { timesService, campeonatosService, partidasService, classificacaoService } from '../services/api'
import { Users, Trophy, Calendar, Medal, TrendingUp, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { user, isAdmin, plano } = useAuth()
  const [stats, setStats] = useState({ times: 0, campeonatos: 0, partidas: 0 })
  const [melhores, setMelhores] = useState({})
  const [recentesPartidas, setRecentesPartidas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [timesRes, campRes, partidasRes, melhoresRes] = await Promise.all([
          timesService.listar({ limit: 1 }),
          campeonatosService.listar({}),
          partidasService.listar({ status_partida: 'finalizada' }),
          classificacaoService.melhorPorNivel(),
        ])

        // Simplificado - conta registros retornados
        setStats({
          times: timesRes.data?.length || 0,
          campeonatos: campRes.data?.length || 0,
          partidas: partidasRes.data?.length || 0,
        })
        setMelhores(melhoresRes.data || {})
        setRecentesPartidas((partidasRes.data || []).slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const nivelLabel = {
    bairro: '🏘️ Bairro',
    municipio: '🏙️ Município',
    estado: '🗺️ Estado',
    pais: '🇧🇷 País',
    continente: '🌎 Continente',
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Bem-vindo, {user?.nome}! Plano atual: <strong style={{ color: 'var(--green-400)' }}>{plano}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/times/novo" className="btn btn-secondary">
            <Plus size={16} /> Novo Time
          </Link>
          <Link to="/campeonatos/novo" className="btn btn-primary">
            <Plus size={16} /> Novo Campeonato
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon green"><Users size={24} /></div>
            <div className="stat-info">
              <h3>{stats.times}</h3>
              <p>Times Cadastrados</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon gold"><Trophy size={24} /></div>
            <div className="stat-info">
              <h3>{stats.campeonatos}</h3>
              <p>Campeonatos</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Calendar size={24} /></div>
            <div className="stat-info">
              <h3>{stats.partidas}</h3>
              <p>Partidas Realizadas</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"><Medal size={24} /></div>
            <div className="stat-info">
              <h3>{Object.values(melhores).filter(Boolean).length}</h3>
              <p>Campeões Ativos</p>
            </div>
          </div>
        </div>

        {/* Plano grátis banner */}
        {plano === 'gratis' && (
          <div style={{
            background: 'linear-gradient(135deg, #064E3B, #065F46)',
            border: '1px solid var(--green-700)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <h3 style={{ color: 'var(--green-300)', marginBottom: 4 }}>🚀 Faça Upgrade para Premium</h3>
              <p style={{ color: 'var(--green-400)', fontSize: 14 }}>
                Crie campeonatos a nível municipal, estadual, nacional e continental.
              </p>
            </div>
            <button className="btn btn-primary" style={{ flexShrink: 0 }}>
              Ver Planos
            </button>
          </div>
        )}

        {/* Melhores por nível */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--gray-200)' }}>
            <Medal size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--gold)' }} />
            Melhores Times por Nível
          </h3>
          <div className="ranking-grid">
            {Object.entries(nivelLabel).map(([nivel, label]) => {
              const time = melhores[nivel]
              return (
                <div key={nivel} className={`ranking-card ${nivel}`}>
                  <div className="ranking-card-header">
                    {label}
                  </div>
                  {time ? (
                    <div className="ranking-team">
                      <div className="ranking-team-logo">
                        {time.escudo_url ? (
                          <img src={time.escudo_url} alt={time.time} style={{ width: '100%', borderRadius: '50%' }} />
                        ) : '⚽'}
                      </div>
                      <div className="ranking-team-info">
                        <h3>{time.time}</h3>
                        <p>{time.pontos} pts · {time.vitorias} vitórias</p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Nenhum campeão ainda</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Últimas partidas */}
        {recentesPartidas.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--gray-200)' }}>
              <Calendar size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--blue-500)' }} />
              Últimas Partidas
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Campeonato</th>
                    <th>Time Casa</th>
                    <th className="center">Placar</th>
                    <th>Time Fora</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentesPartidas.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className={`badge badge-green`}>{p.campeonatos?.nome}</span>
                      </td>
                      <td className="team-cell">
                        <span className="team-logo">⚽</span>
                        {p.time_casa?.nome}
                      </td>
                      <td className="center">
                        <strong style={{ fontSize: 16, color: 'var(--green-400)' }}>
                          {p.gols_casa} × {p.gols_fora}
                        </strong>
                      </td>
                      <td>{p.time_fora?.nome}</td>
                      <td style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                        {p.data_partida
                          ? new Date(p.data_partida).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
