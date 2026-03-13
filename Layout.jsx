import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Users, Trophy, Calendar, Table2,
  Medal, LogOut, Settings, MapPin
} from 'lucide-react'

export default function Layout() {
  const { user, logout, isAdmin, plano } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/times', icon: <Users size={18} />, label: 'Times' },
    { to: '/campeonatos', icon: <Trophy size={18} />, label: 'Campeonatos' },
    { to: '/partidas', icon: <Calendar size={18} />, label: 'Partidas' },
    { to: '/classificacao', icon: <Table2 size={18} />, label: 'Classificação' },
    { to: '/ranking', icon: <Medal size={18} />, label: 'Ranking Global' },
  ]

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚽</div>
          <div>
            <h1>Organize Futebol</h1>
            <span>Global</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Menu Principal</span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-card">
            <div className="user-avatar">
              {user?.nome?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <strong>{user?.nome}</strong>
              <span>{user?.tipo}</span>
              <span className={`plano-badge ${plano}`}>{plano}</span>
            </div>
          </div>
          <button
            className="nav-item"
            onClick={handleLogout}
            style={{ marginTop: 8, color: '#EF4444' }}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
