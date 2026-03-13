import { useState, useEffect } from 'react'
import { classificacaoService, localizacaoService } from '../services/api'
import { Medal, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const NIVEL_CONFIG = {
  bairro:     { label: 'Melhor do Bairro',     emoji: '🏘️', color: 'var(--green-400)', cls: 'bairro' },
  municipio:  { label: 'Melhor do Município',  emoji: '🏙️', color: 'var(--blue-500)',  cls: 'municipio' },
  estado:     { label: 'Melhor do Estado',     emoji: '🗺️', color: 'var(--gold)',       cls: 'estado' },
  pais:       { label: 'Melhor do País',       emoji: '🇧🇷', color: '#A78BFA',          cls: 'pais' },
  continente: { label: 'Melhor do Continente', emoji: '🌎', color: 'var(--red-500)',    cls: 'continente' },
}

export default function RankingPage() {
  const [melhores, setMelhores] = useState({})
  const [ranking, setRanking] = useState([])
  const [filtroNivel, setFiltroNivel] = useState('bairro')
  const [loading, setLoading] = useState(true)
  const [loadingRanking, setLoadingRanking] = useState(false)

  useEffect(() => {
    classificacaoService.melhorPorNivel().then(r => {
      setMelhores(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadRanking()
  }, [filtroNivel])

  const loadRanking = async () => {
    setLoadingRanking(true)
    try {
      const res = await classificacaoService.ranking({ nivel: filtroNivel, limit: 20 })
      setRanking(res.data)
    } catch {
      toast.error('Erro ao carregar ranking.')
    } finally {
      setLoadingRanking(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🏆 Ranking Global</h2>
          <p>Os melhores times em cada nível de competição</p>
        </div>
      </div>

      <div className="page-body">
        {/* Cards dos melhores por nível */}
        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <>
            <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700, color: 'var(--gray-300)' }}>
              <Medal size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--gold)' }} />
              Campeões Atuais
            </h3>
            <div className="ranking-grid" style={{ marginBottom: 40 }}>
              {Object.entries(NIVEL_CONFIG).map(([nivel, cfg]) => {
                const time = melhores[nivel]
                return (
                  <div key={nivel} className={`ranking-card ${cfg.cls}`}>
                    <div className="ranking-card-header">
                      <span>{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </div>
                    {time ? (
                      <>
                        <div className="ranking-team">
                          <div className="ranking-team-logo">
                            {time.escudo_url
                              ? <img src={time.escudo_url} alt={time.time} style={{ width: '100%', borderRadius: '50%' }} />
                              : '⚽'}
                          </div>
                          <div className="ranking-team-info">
                            <h3>{time.time}</h3>
                            <p style={{ color: cfg.color }}>{time.campeonato}</p>
                          </div>
                        </div>
                        <div className="ranking-team-stats">
                          <div className="ranking-stat">
                            <strong style={{ color: cfg.color }}>{time.pontos}</strong>
                            <span>Pontos</span>
                          </div>
                          <div className="ranking-stat">
                            <strong style={{ color: cfg.color }}>{time.vitorias}</strong>
                            <span>Vitórias</span>
                          </div>
                          <div className="ranking-stat">
                            <strong style={{ color: cfg.color }}>{time.saldo_gols > 0 ? '+' : ''}{time.saldo_gols}</strong>
                            <span>Saldo</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--gray-500)', fontSize: 13, padding: '8px 0' }}>
                        Nenhum campeão ainda
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Tabela de ranking detalhado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-300)' }}>
            <TrendingUp size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--green-400)' }} />
            Ranking Detalhado
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(NIVEL_CONFIG).map(([nivel, cfg]) => (
              <button
                key={nivel}
                className={`btn btn-sm ${filtroNivel === nivel ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFiltroNivel(nivel)}
              >
                {cfg.emoji} {cfg.label.split(' ').pop()}
              </button>
            ))}
          </div>
        </div>

        {loadingRanking ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : ranking.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Nenhum dado disponível</h3>
            <p>Registre partidas para gerar o ranking.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Time</th>
                  <th>Campeonato</th>
                  <th className="center">Pts</th>
                  <th className="center">V</th>
                  <th className="center">E</th>
                  <th className="center">D</th>
                  <th className="center">SG</th>
                  <th>Localização</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row, i) => (
                  <tr key={row.time_id || i}>
                    <td className="center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
                        <span style={{ color: 'var(--gray-400)' }}>{i + 1}</span>
                      )}
                    </td>
                    <td>
                      <div className="team-cell">
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--gray-700)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                        }}>
                          {row.escudo_url
                            ? <img src={row.escudo_url} alt={row.time} style={{ width: '100%', borderRadius: '50%' }} />
                            : '⚽'}
                        </div>
                        <strong>{row.time}</strong>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>{row.campeonato}</td>
                    <td className="center">
                      <strong style={{ color: 'var(--green-400)' }}>{row.pontos}</strong>
                    </td>
                    <td className="center" style={{ color: 'var(--green-400)' }}>{row.vitorias}</td>
                    <td className="center" style={{ color: 'var(--gold)' }}>{row.empates}</td>
                    <td className="center" style={{ color: 'var(--red-500)' }}>{row.derrotas}</td>
                    <td className="center">
                      <span style={{ color: row.saldo_gols >= 0 ? 'var(--green-400)' : 'var(--red-500)' }}>
                        {row.saldo_gols > 0 ? '+' : ''}{row.saldo_gols}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {[row.bairro, row.municipio, row.estado, row.pais].filter(Boolean).join(' › ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
