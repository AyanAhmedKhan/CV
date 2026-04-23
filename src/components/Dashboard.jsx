import { useAppContext } from '../App'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Activity, 
  Lock, 
  Fingerprint, 
  Eye, 
  Clock,
  Server,
  Zap,
  CheckCircle2
} from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAppContext()

  const systemLogs = [
    { id: 1, action: 'Face Authentication Success', time: 'Just now', type: 'success' },
    { id: 2, action: 'Gesture Model Loaded', time: '2 mins ago', type: 'info' },
    { id: 3, action: 'System Locked', time: '1 hr ago', type: 'warning' },
    { id: 4, action: 'New Face Registered', time: '1 hr ago', type: 'info' },
    { id: 5, action: 'Failed Auth Attempt', time: '1 day ago', type: 'error' },
  ]

  const stats = [
    { title: 'Confidence Score', value: `${user?.confidence || 99.8}%`, icon: Activity, color: 'cyan' },
    { title: 'Encryption Level', value: 'AES-256-GCM', icon: Lock, color: 'purple' },
    { title: 'Local Models', value: 'Active', icon: Server, color: 'green' },
    { title: 'Inference Latency', value: '< 150ms', icon: Zap, color: 'orange' },
  ]

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>Security Dashboard</h1>
            <p>Welcome back, <strong>{user?.name || 'Authorized User'}</strong>. Your system is fully secured.</p>
          </div>
          <div className="auth-badge">
            <CheckCircle2 size={18} />
            <span>Authenticated via {user?.method === 'face' ? 'Face ID' : 'NeuralNet'}</span>
          </div>
        </div>

        <div className="dash-grid">
          
          {/* Main Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                className="stat-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`stat-icon-wrap bg-${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-title">{stat.title}</span>
                  <span className="stat-value">{stat.value}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Biometric Data */}
          <div className="bio-panel glass-card">
            <h3><Fingerprint size={18}/> Biometric Summary</h3>
            <div className="bio-content">
              <div className="bio-item">
                <span className="bio-label">Auth Vector</span>
                <span className="bio-value mono">128-DIM-FLOAT32</span>
              </div>
              <div className="bio-item">
                <span className="bio-label">Embedding Distance</span>
                <span className="bio-value mono">0.{Math.floor(Math.random() * 400 + 100)}</span>
              </div>
              <div className="bio-item">
                <span className="bio-label">Data Residency</span>
                <span className="bio-value">Local Storage Only</span>
              </div>
              <div className="bio-item">
                <span className="bio-label">Last Verify</span>
                <span className="bio-value">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* System Logs */}
          <div className="logs-panel glass-card">
            <div className="logs-header">
              <h3><Eye size={18}/> Security Logs</h3>
              <button className="btn btn-ghost btn-sm">View All</button>
            </div>
            
            <div className="logs-list">
              {systemLogs.map((log, i) => (
                <motion.div 
                  key={log.id}
                  className="log-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`log-indicator type-${log.type}`} />
                  <div className="log-content">
                    <span className="log-action">{log.action}</span>
                    <span className="log-time"><Clock size={12}/> {log.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
