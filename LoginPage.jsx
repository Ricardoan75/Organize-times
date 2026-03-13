import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { LogIn, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.senha)
      toast.success('Bem-vindo de volta!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-ball">⚽</span>
          <h1>Organize Futebol Global</h1>
          <p>Entre na sua conta para continuar</p>
        </div>

        <form onSubmit={submit}>
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
              placeholder="••••••••"
              value={form.senha}
              onChange={handle}
              required
            />
          </div>
          <button
            className="btn btn-primary btn-block btn-lg"
            type="submit"
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-link">
          Não tem conta? <Link to="/register">Cadastre-se grátis</Link>
        </div>
      </div>
    </div>
  )
}
