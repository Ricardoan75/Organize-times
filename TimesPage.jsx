import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { timesService, localizacaoService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TimesPage() {
  const { isAdmin } = useAuth()
  const [times, setTimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtros, setFiltros] = useState({})

  const [continentes, setContinentes] = useState([])
  const [paises, setPaises] = useState([])
  const [estados, setEstados] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [bairros, setBairros] = useState([])
  const [sel, setSel] = useState({ continente: '', pais: '', estado: '', municipio: '', bairro: '' })

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
    else setBairros([])
  }, [sel.municipio])

  const buscarTimes = async () => {
    setLoading(true)
    try {
      const params = {}
      if (sel.bairro) params.bairro_id = sel.bairro
      if (busca) params.busca = busca
      const res = await timesService.listar(params)
      setTimes(res.data)
    } catch (err) {
      toast.error('Erro ao carregar times.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { buscarTimes() }, [sel.bairro, busca])

  const deletar = async (id) => {
    if (!confirm('Tem certeza que deseja remover este time?')) return
    try {
      await timesService.deletar(id)
      toast.success('Time removido.')
      buscarTimes()
    } catch {
      toast.error('Erro ao remover time.')
    }
  }

  const changeSel = (key, val) => {
    setSel(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'continente') { next.pais = ''; next.estado = ''; next.municipio = ''; next.bairro = '' }
      if (key === 'pais') { next.estado = ''; next.municipio = ''; next.bairro = '' }
      if (key === 'estado') { next.municipio = ''; next.bairro = '' }
      if (key === 'municipio') { next.bairro = '' }
      return next
    })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Times</h2>
          <p>{times.length} times encontrados</p>
        </div>
        <Link to="/times/novo" className="btn btn-primary">
          <Plus size={16} /> Cadastrar Time
        </Link>
      </div>

      <div className="page-body">
        {/* Filtros */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4 }}>Buscar</span>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                  <input
                    className="form-input"
                    placeholder="Nome do time..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    style={{ paddingLeft: 32 }}
                  />
                </div>
              </label>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <span style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4 }}>Continente</span>
              <select className="form-select" value={sel.continente} onChange={e => changeSel('continente', e.target.value)}>
                <option value="">Todos</option>
                {continentes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            {paises.length > 0 && (
              <div style={{ flex: '1 1 140px' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4 }}>País</span>
                <select className="form-select" value={sel.pais} onChange={e => changeSel('pais', e.target.value)}>
                  <option value="">Todos</option>
                  {paises.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            )}
            {estados.length > 0 && (
              <div style={{ flex: '1 1 140px' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4 }}>Estado</span>
                <select className="form-select" value={sel.estado} onChange={e => changeSel('estado', e.target.value)}>
                  <option value="">Todos</option>
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
            )}
            {municipios.length > 0 && (
              <div style={{ flex: '1 1 140px' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4 }}>Município</span>
                <select className="form-select" value={sel.municipio} onChange={e => changeSel('municipio', e.target.value)}>
                  <option value="">Todos</option>
                  {municipios.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
            )}
            {bairros.length > 0 && (
              <div style={{ flex: '1 1 140px' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', display: 'block', marginBottom: 4 }}>Bairro</span>
                <select className="form-select" value={sel.bairro} onChange={e => changeSel('bairro', e.target.value)}>
                  <option value="">Todos</option>
                  {bairros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : times.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚽</div>
            <h3>Nenhum time encontrado</h3>
            <p>Cadastre o primeiro time agora!</p>
            <Link to="/times/novo" className="btn btn-primary">Cadastrar Time</Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Escudo</th>
                  <th>Nome</th>
                  <th>Técnico</th>
                  <th>Localização</th>
                  <th>Cadastro</th>
                  {isAdmin && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {times.map((t) => {
                  const bairro = t.bairros
                  const municipio = bairro?.municipios
                  const estado = municipio?.estados
                  const locStr = [bairro?.nome, municipio?.nome, estado?.nome].filter(Boolean).join(', ')

                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="team-logo" style={{ width: 36, height: 36, background: 'var(--gray-700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                          {t.escudo_url ? <img src={t.escudo_url} alt={t.nome} style={{ width: '100%', borderRadius: '50%' }} /> : '⚽'}
                        </div>
                      </td>
                      <td><strong>{t.nome}</strong></td>
                      <td>{t.tecnico || '—'}</td>
                      <td style={{ color: 'var(--gray-400)', fontSize: 13 }}>{locStr || '—'}</td>
                      <td style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                        {new Date(t.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      {isAdmin && (
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deletar(t.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
