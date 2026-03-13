import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { campeonatosService, timesService, localizacaoService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Lock } from 'lucide-react'

const NIVEIS = [
  { value: 'bairro', label: '🏘️ Bairro', plano: 'gratis' },
  { value: 'municipio', label: '🏙️ Município', plano: 'basico' },
  { value: 'estado', label: '🗺️ Estado', plano: 'basico' },
  { value: 'pais', label: '🇧🇷 País', plano: 'premium' },
  { value: 'continente', label: '🌎 Continente', plano: 'premium' },
]

export default function CriarCampeonatoPage() {
  const { plano } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [times, setTimes] = useState([])
  const [timesSelecionados, setTimesSelecionados] = useState([])

  const [form, setForm] = useState({
    nome: '', nivel: 'bairro',
    data_inicio: '', data_fim: '',
    bairro_id: '', municipio_id: '', estado_id: '', pais_id: '', continente_id: '',
  })

  // Localização
  const [continentes, setContinentes] = useState([])
  const [paises, setPaises] = useState([])
  const [estados, setEstados] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [bairros, setBairros] = useState([])
  const [sel, setSel] = useState({ continente: '', pais: '', estado: '', municipio: '' })

  useEffect(() => {
    localizacaoService.getContinentes().then(r => setContinentes(r.data))
    timesService.listar({ limit: 100 }).then(r => setTimes(r.data))
  }, [])

  useEffect(() => {
    if (sel.continente) localizacaoService.getPaises(sel.continente).then(r => setPaises(r.data))
    else { setPaises([]); setEstados([]); setMunicipios([]); setBairros([]) }
    setForm(f => ({ ...f, continente_id: sel.continente || '' }))
  }, [sel.continente])

  useEffect(() => {
    if (sel.pais) localizacaoService.getEstados(sel.pais).then(r => setEstados(r.data))
    else { setEstados([]); setMunicipios([]); setBairros([]) }
    setForm(f => ({ ...f, pais_id: sel.pais || '' }))
  }, [sel.pais])

  useEffect(() => {
    if (sel.estado) localizacaoService.getMunicipios(sel.estado).then(r => setMunicipios(r.data))
    else { setMunicipios([]); setBairros([]) }
    setForm(f => ({ ...f, estado_id: sel.estado || '' }))
  }, [sel.estado])

  useEffect(() => {
    if (sel.municipio) localizacaoService.getBairros(sel.municipio).then(r => setBairros(r.data))
    else setBairros([])
    setForm(f => ({ ...f, municipio_id: sel.municipio || '' }))
  }, [sel.municipio])

  const changeSel = (key, val) => {
    setSel(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'continente') { next.pais = ''; next.estado = ''; next.municipio = '' }
      if (key === 'pais') { next.estado = ''; next.municipio = '' }
      if (key === 'estado') { next.municipio = '' }
      return next
    })
  }

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const toggleTime = (id) => {
    setTimesSelecionados(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const planoPermite = (nivelPlano) => {
    if (plano === 'premium') return true
    if (plano === 'basico' && ['gratis', 'basico'].includes(nivelPlano)) return true
    if (plano === 'gratis' && nivelPlano === 'gratis') return true
    return false
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) { toast.error('Nome do campeonato é obrigatório.'); return }

    const nivelInfo = NIVEIS.find(n => n.value === form.nivel)
    if (!planoPermite(nivelInfo.plano)) {
      toast.error('Faça upgrade do seu plano para criar este tipo de campeonato.')
      return
    }

    setLoading(true)
    try {
      const payload = { ...form, times_ids: timesSelecionados }
      // Remove campos vazios
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })

      await campeonatosService.criar(payload)
      toast.success('Campeonato criado com sucesso!')
      navigate('/campeonatos')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar campeonato.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Criar Campeonato</h2>
          <p>Configure o novo campeonato</p>
        </div>
        <Link to="/campeonatos" className="btn btn-secondary">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>

      <div className="page-body">
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, maxWidth: 1100 }}>
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700 }}>📋 Informações Gerais</h3>
              <div className="form-group">
                <label>Nome do Campeonato *</label>
                <input className="form-input" name="nome" placeholder="Ex: Copa do Bairro 2024" value={form.nome} onChange={handle} required />
              </div>

              <div className="form-group">
                <label>Nível do Campeonato</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {NIVEIS.map((n) => {
                    const permitido = planoPermite(n.plano)
                    return (
                      <button
                        key={n.value}
                        type="button"
                        onClick={() => permitido && setForm(f => ({ ...f, nivel: n.value }))}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 8,
                          border: `2px solid ${form.nivel === n.value ? 'var(--green-500)' : 'var(--gray-600)'}`,
                          background: form.nivel === n.value ? 'var(--green-900)' : 'var(--gray-700)',
                          color: permitido ? 'var(--gray-200)' : 'var(--gray-600)',
                          fontSize: 12, cursor: permitido ? 'pointer' : 'not-allowed',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          position: 'relative',
                        }}
                      >
                        {n.label}
                        {!permitido && <Lock size={12} style={{ position: 'absolute', top: 4, right: 4, color: 'var(--gold)' }} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Data de Início</label>
                  <input className="form-input" type="date" name="data_inicio" value={form.data_inicio} onChange={handle} />
                </div>
                <div className="form-group">
                  <label>Data de Término</label>
                  <input className="form-input" type="date" name="data_fim" value={form.data_fim} onChange={handle} />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>📍 Localização do Campeonato</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Continente</label>
                  <select className="form-select" value={sel.continente} onChange={e => changeSel('continente', e.target.value)}>
                    <option value="">Selecione...</option>
                    {continentes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>País</label>
                  <select className="form-select" value={sel.pais} onChange={e => changeSel('pais', e.target.value)} disabled={!paises.length}>
                    <option value="">Selecione...</option>
                    {paises.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select className="form-select" value={sel.estado} onChange={e => changeSel('estado', e.target.value)} disabled={!estados.length}>
                    <option value="">Selecione...</option>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Município</label>
                  <select className="form-select" value={sel.municipio} onChange={e => changeSel('municipio', e.target.value)} disabled={!municipios.length}>
                    <option value="">Selecione...</option>
                    {municipios.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
              </div>
              {bairros.length > 0 && (
                <div className="form-group">
                  <label>Bairro</label>
                  <select className="form-select" name="bairro_id" value={form.bairro_id} onChange={handle}>
                    <option value="">Selecione...</option>
                    {bairros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Times */}
          <div>
            <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 20 }}>
              <h3 style={{ marginBottom: 4, fontSize: 15, fontWeight: 700 }}>
                ⚽ Times Participantes
              </h3>
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 16 }}>
                {timesSelecionados.length} selecionado{timesSelecionados.length !== 1 ? 's' : ''}
              </p>
              <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {times.map((t) => {
                  const selecionado = timesSelecionados.includes(t.id)
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTime(t.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: selecionado ? 'var(--green-900)' : 'var(--gray-700)',
                        border: `1px solid ${selecionado ? 'var(--green-600)' : 'transparent'}`,
                        transition: 'all 0.1s',
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--gray-600)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                        flexShrink: 0,
                      }}>
                        {t.escudo_url ? <img src={t.escudo_url} style={{ width: '100%', borderRadius: '50%' }} /> : '⚽'}
                      </div>
                      <span style={{ fontSize: 13, color: selecionado ? 'var(--green-300)' : 'var(--gray-200)', flex: 1 }}>{t.nome}</span>
                      {selecionado && <span style={{ color: 'var(--green-400)', fontSize: 16 }}>✓</span>}
                    </div>
                  )
                })}
                {times.length === 0 && (
                  <p style={{ color: 'var(--gray-500)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                    Nenhum time cadastrado ainda.
                  </p>
                )}
              </div>

              <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 16 }}>
                <Save size={16} />
                {loading ? 'Criando...' : 'Criar Campeonato'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
