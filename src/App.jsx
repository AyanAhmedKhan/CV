import { useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import FaceAuth from './components/FaceAuth'
import GestureControl from './components/GestureControl'
import Dashboard from './components/Dashboard'
import './App.css'

export const AppContext = createContext(null)

export function useAppContext() {
  return useContext(AppContext)
}

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])

  const addNotification = (message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4000)
  }

  const login = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentPage('dashboard')
    addNotification(`Welcome back, ${userData.name}!`, 'success')
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setCurrentPage('landing')
    addNotification('Logged out successfully', 'info')
  }

  const contextValue = {
    currentPage,
    setCurrentPage,
    isAuthenticated,
    user,
    login,
    logout,
    addNotification
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3 }
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <motion.div key="landing" {...pageVariants}>
            <LandingPage />
          </motion.div>
        )
      case 'faceauth':
        return (
          <motion.div key="faceauth" {...pageVariants}>
            <FaceAuth />
          </motion.div>
        )
      case 'gesture':
        return (
          <motion.div key="gesture" {...pageVariants}>
            <GestureControl />
          </motion.div>
        )
      case 'dashboard':
        return (
          <motion.div key="dashboard" {...pageVariants}>
            <Dashboard />
          </motion.div>
        )
      default:
        return (
          <motion.div key="landing" {...pageVariants}>
            <LandingPage />
          </motion.div>
        )
    }
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app">
        <Header />
        <main className="main-content">
          <AnimatePresence mode="wait">
            {renderPage()}
          </AnimatePresence>
        </main>

        {/* Notification Toast */}
        <div className="toast-container">
          <AnimatePresence>
            {notifications.map(notif => (
              <motion.div
                key={notif.id}
                className={`toast toast-${notif.type}`}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <div className="toast-icon">
                  {notif.type === 'success' ? '✓' : notif.type === 'error' ? '✕' : 'ℹ'}
                </div>
                <span>{notif.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AppContext.Provider>
  )
}

export default App
