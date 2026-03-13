import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { classificacaoService, campeonatosService } from '../services/api'
import toast from 'react-hot-toast'

export default function ClassificacaoPage() {
  const [searchParams] = useSearchParams()
  const campIdParam = searchParams.get('campeonato')

  const [campeonatos, setCampeonatos] = useState([])
  const [campSelecionado, setCampSelecionado] = useState(campIdParam || '')
  const [classificacao, setClassificacao] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    campeonatosService.listar({}).then(r => setCampeonatos(r.data))
  }, [])

  useEffect(() => {
    if (campSelecionado) loadClassificacao()
  }, [campSelecionado])

  const loadClassificacao = async () => {
    setLoading(true)
    try {
      const res = await classificacaoService.campeonato(campSelecionado)
      setClassificacao(res.data)
    } catch {
      toast.error('Erro ao carregar classificação.')
    } finally {
      setLoading(false)
    }
  }

  const campAtual = campeonatos.find(c => c.id === campSelecionado)

  const posStyle = (pos) => {
    if (pos === 1) return { color: 'var(--gold)', fontWeight: 800, fontSize: 18 }
    if (pos === 2) return { color: 'var(--silver)', fontWeight: 700 }
    if (pos === 3) return { color: 'var(--bronze)', fontWeight: 700 }
    return { color: 'var(--gray-400)' }
  }

  const posEmoji = (pos) => {
    if (pos === 1) return '🥇'
    if (pos === 2) return '🥈'
    if (pos === 3) return '🥉'
    return pos
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Tabela de Classificação</h2>
          <p>{campAtual ? campAtual.nome : 'Selecione um campeonato'}</p>
        </div>
      </div>

      <div className="page-body">
        <div className="filter-bar" style={{ marginBottom: 24 }}>
          <select
            className="form-select"
            value={campSelecionado}
            onChange={e => setCampSelecionado(e.target.value)}
            style={{ minWidth: 280 }}
          >
            <option value="">Selecione um campeonato...</option>
            {campeonatos.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.nivel})</option>)}
          </select>
        </div>

        {!campSelecionado ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Selecione um campeonato</h3>
            <p>Escolha o campeonato acima para ver a classificação</p>
          </div>
        ) : loading ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : classificacao.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Nenhuma classificação ainda</h3>
            <p>Registre partidas para gerar a classificação automaticamente.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}>Pos</th>
                  <th>Time</th>
                  <th className="center">PTS</th>
                  <th className="center">J</th>
                  <th className="center">V</th>
                  <th className="center">E</th>
                  <th className="center">D</th>
                  <th className="center">GP</th>
                  <th className="center">GC</th>
                  <th className="center">SG</th>
                  <th className="center" style={{ width: 120 }}>Desempenho</th>
                </tr>
              </thead>
              <tbody>
                {classificacao.map((row) => (
                  <tr key={row.id}>
                    <td className="center">
                      <span style={posStyle(row.posicao)}>{posEmoji(row.posicao)}</span>
                    </td>
                    <td>
                      <div className="team-cell">
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--gray-700)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                        }}>
                          {row.times?.escudo_url
                            ? <img src={row.times.escudo_url} alt={row.times.nome} style={{ width: '100%', borderRadius: '50%' }} />
                            : '⚽'}
                        </div>
                        <strong style={{ color: row.posicao <= 3 ? 'var(--gray-100)' : 'var(--gray-200)' }}>
                          {row.times?.nome}
                        </strong>
                      </div>
                    </td>
                    <td className="center">
                      <strong style={{ fontSize: 16, color: 'var(--green-400)' }}>{row.pontos}</strong>
                    </td>
                    <td className="center">{row.jogos}</td>
                    <td className="center" style={{ color: 'var(--green-400)' }}>{row.vitorias}</td>
                    <td className="center" style={{ color: 'var(--gold)' }}>{row.empates}</td>
                    <td className="center" style={{ color: 'var(--red-500)' }}>{row.derrotas}</td>
                    <td className="center">{row.gols_pro}</td>
                    <td className="center">{row.gols_contra}</td>
                    <td className="center">
                      <span style={{ color: row.saldo_gols >= 0 ? 'var(--green-400)' : 'var(--red-500)' }}>
                        {row.saldo_gols > 0 ? '+' : ''}{row.saldo_gols}
                      </span>
                    </td>
                    <td className="center">
                      {/* Minibarra de desempenho */}
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        {row.jogos > 0 ? (
                          <>
                            <div style={{
                              height: 8, borderRadius: 4,
                              background: 'var(--green-500)',
                              width: `${(row.vitorias / row.jogos) * 60}px`,
                              minWidth: row.vitorias > 0 ? 4 : 0,
                            }} title={`${row.vitorias} vitórias`} />
                            <div style={{
                              height: 8, borderRadius: 4,
                              background: 'var(--gold)',
                              width: `${(row.empates / row.jogos) * 60}px`,
                              minWidth: row.empates > 0 ? 4 : 0,
                            }} title={`${row.empates} empates`} />
                            <div style={{
                              height: 8, borderRadius: 4,
                              background: 'var(--red-500)',
                              width: `${(row.derrotas / row.jogos) * 60}px`,
                              minWidth: row.derrotas > 0 ? 4 : 0,
                            }} title={`${row.derrotas} derrotas`} />
                          </>
                        ) : <span style={{ color: 'var(--gray-600)', fontSize: 11 }}>—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', background: 'var(--gray-700)', fontSize: 12, color: 'var(--gray-400)', display: 'flex', gap: 16 }}>
              <span><strong style={{ color: 'var(--gray-200)' }}>PTS</strong> Pontos</span>
              <span><strong style={{ color: 'var(--gray-200)' }}>J</strong> Jogos</span>
              <span><strong style={{ color: 'var(--gray-200)' }}>V</strong> Vitórias</span>
              <span><strong style={{ color: 'var(--gray-200)' }}>E</strong> Empates</span>
              <span><strong style={{ color: 'var(--gray-200)' }}>D</strong> Derrotas</span>
              <span><strong style={{ color: 'var(--gray-200)' }}>GP</strong> Gols Pró</span>
              <span><strong style={{ color: 'var(--gray-200)' }}>GC</strong> Gols Contra</span>
              <span><strong style={{ color: 'var(--gray-200)' }}>SG</strong> Saldo de Gols</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
