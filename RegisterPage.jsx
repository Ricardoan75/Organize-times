import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', tipo: 'tecnico' })
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.senha.length < 6) {
      toast.error('A senha precisa ter ao menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      await register(form.nome, form.email, form.senha, form.tipo)
      toast.success('Conta criada com sucesso!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-ball">⚽</span>
          <h1>Criar Conta</h1>
          <p>Cadastre-se gratuitamente</p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Nome Completo</label>
            <input
              className="form-input"
              type="text"
              name="nome"
              placeholder="João Silva"
              value={form.nome}
              onChange={handle}
              required
            />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handle}
              required
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              className="form-input"
              type="password"
              name="senha"
              placeholder="Mínimo 6 caracteres"
              value={form.senha}
              onChange={handle}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Tipo de Conta</label>
            <select className="form-select" name="tipo" value={form.tipo} onChange={handle}>
              <option value="tecnico">🦺 Técnico / Organizador</option>
              <option value="administrador">👑 Administrador</option>
            </select>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
              Técnicos podem criar times e campeonatos de bairro gratuitamente.
            </p>
          </div>

          <button
            className="btn btn-primary btn-block btn-lg"
            type="submit"
            disabled={loading}
          >
            <UserPlus size={18} />
            {loading ? 'Criando conta...' : 'Criar Conta Grátis'}
          </button>
        </form>

        <div className="auth-link">
          Já tem conta? <Link to="/login">Faça login</Link>
        </div>
      </div>
    </div>
  )
}
