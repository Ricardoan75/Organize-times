import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { timesService, localizacaoService } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Upload } from 'lucide-react'

export default function CriarTimePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '', tecnico: '', escudo_url: '', bairro_id: '',
  })

  const [continentes, setContinentes] = useState([])
  const [paises, setPaises] = useState([])
  const [estados, setEstados] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [bairros, setBairros] = useState([])
  const [sel, setSel] = useState({ continente: '', pais: '', estado: '', municipio: '' })

  useEffect(() => {
    localizacaoService.getContinentes().then(r => setContinentes(r.data))
  }, [])

  useEffect(() => {
    if (sel.continente) localizacaoService.getPaises(sel.continente).then(r => setPaises(r.data))
    else { setPaises([]); setEstados([]); setMunicipios([]); setBairros([]) }
  }, [sel.continente])

  useEffect(() => {
    if (sel.pais) localizacaoService.getEstados(sel.pais).then(r => setEstados(r.data))
    else { setEstados([]); setMunicipios([]); setBairros([]) }
  }, [sel.pais])

  useEffect(() => {
    if (sel.estado) localizacaoService.getMunicipios(sel.estado).then(r => setMunicipios(r.data))
    else { setMunicipios([]); setBairros([]) }
  }, [sel.estado])

  useEffect(() => {
    if (sel.municipio) localizacaoService.getBairros(sel.municipio).then(r => setBairros(r.data))
    else { setBairros([]); setForm(f => ({ ...f, bairro_id: '' })) }
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

  const submit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) { toast.error('Nome do time é obrigatório.'); return }
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.bairro_id) delete payload.bairro_id
      if (!payload.escudo_url) delete payload.escudo_url
      await timesService.criar(payload)
      toast.success('Time cadastrado com sucesso!')
      navigate('/times')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao cadastrar time.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Cadastrar Time</h2>
          <p>Preencha as informações do novo time</p>
        </div>
        <Link to="/times" className="btn btn-secondary">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 720 }}>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nome do Time *</label>
                <input className="form-input" name="nome" placeholder="Ex: Flamengo do Bairro" value={form.nome} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Técnico / Treinador</label>
                <input className="form-input" name="tecnico" placeholder="Nome do técnico" value={form.tecnico} onChange={handle} />
              </div>
            </div>

            <div className="form-group">
              <label>URL do Escudo (imagem)</label>
              <input className="form-input" name="escudo_url" type="url" placeholder="https://..." value={form.escudo_url} onChange={handle} />
              {form.escudo_url && (
                <img src={form.escudo_url} alt="Escudo" style={{ width: 64, height: 64, borderRadius: '50%', marginTop: 8, border: '2px solid var(--gray-600)' }} />
              )}
            </div>

            <div style={{ marginBottom: 24, padding: '16px', background: 'var(--gray-700)', borderRadius: 'var(--radius)' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--gray-300)', fontSize: 14 }}>📍 Localização do Time</h4>
              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Continente</label>
                  <select className="form-select" value={sel.continente} onChange={e => changeSel('continente', e.target.value)}>
                    <option value="">Selecione...</option>
                    {continentes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>País</label>
                  <select className="form-select" value={sel.pais} onChange={e => changeSel('pais', e.target.value)} disabled={!paises.length}>
                    <option value="">Selecione...</option>
                    {paises.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Estado</label>
                  <select className="form-select" value={sel.estado} onChange={e => changeSel('estado', e.target.value)} disabled={!estados.length}>
                    <option value="">Selecione...</option>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Município</label>
                  <select className="form-select" value={sel.municipio} onChange={e => changeSel('municipio', e.target.value)} disabled={!municipios.length}>
                    <option value="">Selecione...</option>
                    {municipios.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Bairro</label>
                <select className="form-select" name="bairro_id" value={form.bairro_id} onChange={handle} disabled={!bairros.length}>
                  <option value="">Selecione o bairro...</option>
                  {bairros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              <Save size={18} />
              {loading ? 'Salvando...' : 'Cadastrar Time'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
