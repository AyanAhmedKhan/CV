import { useAppContext } from '../App'
import { motion } from 'framer-motion'
import { 
  Scan, 
  Hand, 
  PenTool,
  LogOut, 
  Shield, 
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import './Header.css'

export default function Header() {
  const { currentPage, setCurrentPage, isAuthenticated, user, logout } = useAppContext()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'landing', label: 'Home', icon: Shield },
    { id: 'faceauth', label: 'Face Auth', icon: Scan },
    { id: 'gesture', label: 'Gestures', icon: Hand },
    { id: 'airdraw', label: 'Air Draw', icon: PenTool },
  ]

  if (isAuthenticated) {
    navItems.push({ id: 'dashboard', label: 'Dashboard', icon: Shield })
  }

  return (
    <header className="header">
      <div className="header-inner">
        <motion.div 
          className="header-logo"
          whileHover={{ scale: 1.02 }}
          onClick={() => setCurrentPage('landing')}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-icon">
            <Shield size={22} />
          </div>
          <div className="logo-text">
            <span className="logo-name">NeuralGate</span>
            <span className="logo-tag">AI Security</span>
          </div>
        </motion.div>

        <nav className="header-nav desktop-nav">
          {navItems.map(item => (
            <motion.button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
              {currentPage === item.id && (
                <motion.div
                  className="nav-indicator"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="header-actions">
          {isAuthenticated && user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.name}</span>
              <motion.button 
                className="btn btn-ghost btn-sm"
                onClick={logout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut size={16} />
              </motion.button>
            </div>
          )}

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div 
          className="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {navItems.map(item => (
            <button
              key={item.id}
              className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentPage(item.id)
                setMobileMenuOpen(false)
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
          {isAuthenticated && (
            <button 
              className="mobile-nav-item logout"
              onClick={() => {
                logout()
                setMobileMenuOpen(false)
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
        </motion.div>
      )}
    </header>
  )
}
