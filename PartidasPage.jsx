import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { partidasService, campeonatosService } from '../services/api'
import toast from 'react-hot-toast'
import { Plus, Check } from 'lucide-react'

export default function PartidasPage() {
  const [searchParams] = useSearchParams()
  const campIdParam = searchParams.get('campeonato')

  const [partidas, setPartidas] = useState([])
  const [campeonatos, setCampeonatos] = useState([])
  const [campSelecionado, setCampSelecionado] = useState(campIdParam || '')
  const [timesDisp, setTimesDisp] = useState([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [novaPartida, setNovaPartida] = useState({ time_casa_id: '', time_fora_id: '', data_partida: '' })
  const [placarModal, setPlacarModal] = useState(null) // { partida, gols_casa, gols_fora }

  useEffect(() => {
    campeonatosService.listar({}).then(r => setCampeonatos(r.data))
  }, [])

  useEffect(() => {
    load()
    if (campSelecionado) {
      campeonatosService.obter(campSelecionado).then(r => {
        const times = r.data?.campeonato_times?.map(ct => ct.times) || []
        setTimesDisp(times)
      }).catch(() => {})
    }
  }, [campSelecionado])

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (campSelecionado) params.campeonato_id = campSelecionado
      const res = await partidasService.listar(params)
      setPartidas(res.data)
    } catch {
      toast.error('Erro ao carregar partidas.')
    } finally {
      setLoading(false)
    }
  }

  const criarPartida = async (e) => {
    e.preventDefault()
    if (!campSelecionado) { toast.error('Selecione um campeonato.'); return }
    if (novaPartida.time_casa_id === novaPartida.time_fora_id) { toast.error('Os times não podem ser iguais.'); return }
    try {
      await partidasService.criar({
        campeonato_id: campSelecionado,
        ...novaPartida,
        data_partida: novaPartida.data_partida || undefined,
      })
      toast.success('Partida criada!')
      setCriando(false)
      setNovaPartida({ time_casa_id: '', time_fora_id: '', data_partida: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar partida.')
    }
  }

  const registrarPlacar = async () => {
    try {
      await partidasService.registrarPlacar(placarModal.partida.id, {
        gols_casa: parseInt(placarModal.gols_casa) || 0,
        gols_fora: parseInt(placarModal.gols_fora) || 0,
      })
      toast.success('Placar registrado! Classificação atualizada.')
      setPlacarModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao registrar placar.')
    }
  }

  const statusColors = {
    agendada: 'badge-gray',
    em_andamento: 'badge-green',
    finalizada: 'badge-blue',
    cancelada: 'badge-red',
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Partidas</h2>
          <p>{partidas.length} partida{partidas.length !== 1 ? 's' : ''}</p>
        </div>
        {campSelecionado && (
          <button className="btn btn-primary" onClick={() => setCriando(true)}>
            <Plus size={16} /> Nova Partida
          </button>
        )}
      </div>

      <div className="page-body">
        {/* Filtro por campeonato */}
        <div className="filter-bar">
          <select
            className="form-select"
            value={campSelecionado}
            onChange={e => setCampSelecionado(e.target.value)}
            style={{ minWidth: 260 }}
          >
            <option value="">Todos os Campeonatos</option>
            {campeonatos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        {/* Form criar partida */}
        {criando && (
          <div className="card" style={{ marginBottom: 24, borderColor: 'var(--green-700)' }}>
            <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Agendar Nova Partida</h3>
            <form onSubmit={criarPartida}>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Time da Casa</label>
                  <select className="form-select" value={novaPartida.time_casa_id}
                    onChange={e => setNovaPartida(p => ({ ...p, time_casa_id: e.target.value }))} required>
                    <option value="">Selecione...</option>
                    {timesDisp.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Time Visitante</label>
                  <select className="form-select" value={novaPartida.time_fora_id}
                    onChange={e => setNovaPartida(p => ({ ...p, time_fora_id: e.target.value }))} required>
                    <option value="">Selecione...</option>
                    {timesDisp.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Data/Hora</label>
                  <input className="form-input" type="datetime-local" value={novaPartida.data_partida}
                    onChange={e => setNovaPartida(p => ({ ...p, data_partida: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">Agendar Partida</button>
                <button className="btn btn-secondary" type="button" onClick={() => setCriando(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de partidas */}
        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : partidas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>Nenhuma partida encontrada</h3>
            <p>Selecione um campeonato e crie a primeira partida.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campeonato</th>
                  <th>Time Casa</th>
                  <th className="center">Placar</th>
                  <th>Time Visitante</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {partidas.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.campeonatos?.nome}</td>
                    <td>
                      <div className="team-cell">
                        <span style={{ fontSize: 18 }}>⚽</span>
                        <strong>{p.time_casa?.nome}</strong>
                      </div>
                    </td>
                    <td className="center">
                      {p.status === 'finalizada' ? (
                        <strong style={{ fontSize: 18, color: 'var(--green-400)' }}>
                          {p.gols_casa} × {p.gols_fora}
                        </strong>
                      ) : (
                        <span style={{ color: 'var(--gray-500)' }}>× </span>
                      )}
                    </td>
                    <td>{p.time_fora?.nome}</td>
                    <td style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                      {p.data_partida ? new Date(p.data_partida).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[p.status] || 'badge-gray'}`}>
                        {p.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {p.status !== 'finalizada' && p.status !== 'cancelada' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPlacarModal({ partida: p, gols_casa: 0, gols_fora: 0 })}
                        >
                          <Check size={14} /> Placar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Placar */}
      {placarModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 420 }}>
            <h3 style={{ marginBottom: 8, fontSize: 16, fontWeight: 700 }}>🏁 Registrar Placar</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 20 }}>
              A classificação será atualizada automaticamente.
            </p>
            <div className="score-display">
              <div className="score-team">
                <strong>{placarModal.partida.time_casa?.nome}</strong>
                <input
                  className="score-input"
                  type="number"
                  min="0"
                  value={placarModal.gols_casa}
                  onChange={e => setPlacarModal(m => ({ ...m, gols_casa: e.target.value }))}
                />
              </div>
              <div className="score-vs">×</div>
              <div className="score-team">
                <strong>{placarModal.partida.time_fora?.nome}</strong>
                <input
                  className="score-input"
                  type="number"
                  min="0"
                  value={placarModal.gols_fora}
                  onChange={e => setPlacarModal(m => ({ ...m, gols_fora: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={registrarPlacar}>
                <Check size={16} /> Confirmar Placar
              </button>
              <button className="btn btn-secondary" onClick={() => setPlacarModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
