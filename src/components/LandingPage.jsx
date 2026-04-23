import { useAppContext } from '../App'
import { motion } from 'framer-motion'
import { 
  Scan, 
  Hand,
  PenTool,
  Shield, 
  Zap, 
  Lock, 
  Eye,
  Fingerprint,
  Brain,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Globe
} from 'lucide-react'
import './LandingPage.css'

const features = [
  {
    icon: Scan,
    title: 'Facial Recognition',
    description: 'Deep learning powered face detection and matching using TensorFlow.js models running entirely in your browser.',
    color: 'cyan',
    gradient: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(139,92,246,0.08))',
  },
  {
    icon: Hand,
    title: 'Gesture Control',
    description: 'MediaPipe hand tracking with real-time 21-landmark detection for intuitive gesture-based system control.',
    color: 'purple',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.08))',
  },
  {
    icon: PenTool,
    title: 'Air Drawing',
    description: 'Use your index finger to sketch neon artwork in 3D space. Creates beautiful patterns with zero-latency canvas rendering.',
    color: 'pink',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(0,212,255,0.08))',
  },
  {
    icon: Lock,
    title: '100% Client-Side',
    description: 'Zero server round-trips. All processing happens locally — your biometric data never leaves your device.',
    color: 'green',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,212,255,0.08))',
  },
  {
    icon: Brain,
    title: 'Neural Network',
    description: 'Pre-trained deep neural networks for facial feature extraction with 128-dimensional face descriptors.',
    color: 'pink',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.08))',
  },
  {
    icon: Zap,
    title: 'Real-Time Processing',
    description: 'Optimized for 30+ FPS inference using WebGL acceleration on modern browsers and devices.',
    color: 'orange',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.08))',
  },
  {
    icon: Globe,
    title: 'Deploy Anywhere',
    description: 'Static site deployment on Vercel, Netlify, or any CDN. No backend, no server costs, instant global delivery.',
    color: 'cyan',
    gradient: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(16,185,129,0.15))',
  },
]

const stats = [
  { value: '99.4%', label: 'Recognition Accuracy' },
  { value: '<200ms', label: 'Detection Latency' },
  { value: '21', label: 'Hand Landmarks' },
  { value: '0', label: 'Server Dependencies' },
]

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
}

export default function LandingPage() {
  const { setCurrentPage } = useAppContext()

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-effects">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-grid" />
        </div>

        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={14} />
            <span>Powered by TensorFlow.js & MediaPipe</span>
          </motion.div>

          <h1 className="hero-title">
            <span className="hero-title-line">Next-Gen Biometric</span>
            <span className="hero-title-line gradient-text">Authentication & Control</span>
          </h1>

          <p className="hero-description">
            A fully client-side AI security platform combining facial recognition authentication 
            with hand gesture control — powered by neural networks running entirely in your browser.
          </p>

          <div className="hero-cta">
            <motion.button 
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentPage('faceauth')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Scan size={20} />
              <span>Face Authentication</span>
              <ArrowRight size={18} />
            </motion.button>
            <motion.button 
              className="btn btn-secondary btn-lg"
              onClick={() => setCurrentPage('gesture')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Hand size={20} />
              <span>Gesture Control</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-face-grid">
            <div className="face-scan-frame">
              <div className="scan-corner tl" />
              <div className="scan-corner tr" />
              <div className="scan-corner bl" />
              <div className="scan-corner br" />
              <div className="scan-line" />
              <div className="face-placeholder">
                <Eye size={48} strokeWidth={1} />
                <span>Face Detection Active</span>
              </div>
            </div>
            <div className="hero-landmarks">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="landmark-dot"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${15 + Math.random() * 70}%`,
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.15,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <motion.section 
        className="stats-bar"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
      >
        {stats.map((stat, i) => (
          <motion.div key={i} className="stat-item" variants={itemVariants}>
            <span className="stat-value gradient-text">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </motion.section>

      {/* Features */}
      <section className="features-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Features</span>
          <h2>Built with cutting-edge AI</h2>
          <p>Enterprise-grade biometric security running entirely in the browser</p>
        </motion.div>

        <motion.div 
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              className={`feature-card glass-card`}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              style={{ background: feature.gradient }}
            >
              <div className={`feature-icon feature-icon-${feature.color}`}>
                <feature.icon size={22} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-tag">How It Works</span>
          <h2>Three steps to security</h2>
        </motion.div>

        <motion.div 
          className="steps-track"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {[
            { num: '01', title: 'Register Face', desc: 'Look at your camera to capture facial features. The AI creates a unique embedding.', icon: Fingerprint },
            { num: '02', title: 'Authenticate', desc: 'Log in by presenting your face. Real-time matching against stored embeddings.', icon: Shield },
            { num: '03', title: 'Gesture & Draw', desc: 'Control the system with hand signs, or use Air Drawing to create artwork mid-air.', icon: Hand },
          ].map((step, i) => (
            <motion.div key={i} className="step-card" variants={itemVariants}>
              <div className="step-num">{step.num}</div>
              <div className="step-icon-wrap">
                <step.icon size={28} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              {i < 2 && <ChevronRight className="step-arrow" size={20} />}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <motion.div 
          className="cta-card glass-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Ready to experience the future?</h2>
          <p>Try facial recognition authentication and gesture-based control right now — no signup required.</p>
          <div className="cta-buttons">
            <motion.button 
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentPage('faceauth')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>Get Started</span>
              <ArrowRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Shield size={18} />
            <span className="gradient-text">NeuralGate</span>
          </div>
          <p className="footer-copy">
            © 2026 NeuralGate AI Security. All processing happens client-side. 
            <br />Built with TensorFlow.js, MediaPipe, and React.
          </p>
        </div>
      </footer>
    </div>
  )
}
