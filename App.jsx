import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TimesPage from './pages/TimesPage'
import CriarTimePage from './pages/CriarTimePage'
import CampeonatosPage from './pages/CampeonatosPage'
import CriarCampeonatoPage from './pages/CriarCampeonatoPage'
import PartidasPage from './pages/PartidasPage'
import ClassificacaoPage from './pages/ClassificacaoPage'
import RankingPage from './pages/RankingPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Rotas protegidas */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="times" element={<TimesPage />} />
            <Route path="times/novo" element={<CriarTimePage />} />
            <Route path="campeonatos" element={<CampeonatosPage />} />
            <Route path="campeonatos/novo" element={<CriarCampeonatoPage />} />
            <Route path="partidas" element={<PartidasPage />} />
            <Route path="classificacao" element={<ClassificacaoPage />} />
            <Route path="ranking" element={<RankingPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
