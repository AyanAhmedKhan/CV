import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import * as faceapi from 'face-api.js'
import {
  Camera,
  CameraOff,
  UserPlus,
  LogIn,
  Scan,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  RefreshCw,
  Eye,
  Users,
  X
} from 'lucide-react'
import './FaceAuth.css'

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model'

export default function FaceAuth() {
  const { login, addNotification } = useAppContext()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const detectionIntervalRef = useRef(null)

  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [cameraOn, setCameraOn] = useState(false)
  const [mode, setMode] = useState('idle') // idle, register, login
  const [registeredFaces, setRegisteredFaces] = useState(() => {
    try {
      const saved = localStorage.getItem('neuralgate_faces')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [registerName, setRegisterName] = useState('')
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [detectedFace, setDetectedFace] = useState(null)
  const [matchResult, setMatchResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load face-api models
  const loadModels = async () => {
    if (modelsLoaded) return
    setLoadingModels(true)
    setLoadProgress(0)
    setStatus({ type: 'loading', message: 'Loading neural network models...' })

    try {
      const models = [
        faceapi.nets.tinyFaceDetector,
        faceapi.nets.faceLandmark68Net,
        faceapi.nets.faceRecognitionNet,
        faceapi.nets.faceExpressionNet,
      ]

      for (let i = 0; i < models.length; i++) {
        await models[i].loadFromUri(MODEL_URL)
        setLoadProgress(((i + 1) / models.length) * 100)
      }

      setModelsLoaded(true)
      setStatus({ type: 'success', message: 'Models loaded successfully!' })
      addNotification('AI models loaded — ready for face detection', 'success')
    } catch (err) {
      console.error('Model loading error:', err)
      setStatus({ type: 'error', message: 'Failed to load models. Check your connection.' })
      addNotification('Failed to load AI models', 'error')
    } finally {
      setLoadingModels(false)
    }
  }

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraOn(true)
        setStatus({ type: 'success', message: 'Camera active' })
      }
    } catch (err) {
      console.error('Camera error:', err)
      setStatus({ type: 'error', message: 'Camera access denied. Please allow camera permissions.' })
      addNotification('Camera access denied', 'error')
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    setCameraOn(false)
    setDetectedFace(null)
    setMatchResult(null)
    setMode('idle')
  }

  // Run face detection continuously
  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !modelsLoaded) return

      const video = videoRef.current
      if (video.readyState !== 4) return

      const canvas = canvasRef.current
      const displaySize = { width: video.videoWidth, height: video.videoHeight }
      faceapi.matchDimensions(canvas, displaySize)

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions()

      const resized = faceapi.resizeResults(detections, displaySize)

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw custom detection boxes
      resized.forEach(det => {
        const box = det.detection.box
        ctx.strokeStyle = '#00d4ff'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.strokeRect(box.x, box.y, box.width, box.height)
        ctx.setLineDash([])

        // Draw landmarks
        const landmarks = det.landmarks.positions
        ctx.fillStyle = 'rgba(0, 212, 255, 0.6)'
        landmarks.forEach(pt => {
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI)
          ctx.fill()
        })

        // Detection score
        ctx.fillStyle = '#00d4ff'
        ctx.font = '12px Inter'
        ctx.fillText(
          `${(det.detection.score * 100).toFixed(1)}%`,
          box.x,
          box.y - 8
        )
      })

      if (resized.length > 0) {
        setDetectedFace(resized[0])
      } else {
        setDetectedFace(null)
      }
    }, 150)
  }, [modelsLoaded])

  useEffect(() => {
    if (cameraOn && modelsLoaded) {
      startDetection()
    }
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [cameraOn, modelsLoaded, startDetection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Register face
  const handleRegister = async () => {
    if (!registerName.trim()) {
      setStatus({ type: 'error', message: 'Please enter your name first.' })
      return
    }
    if (!detectedFace) {
      setStatus({ type: 'error', message: 'No face detected. Look at the camera.' })
      return
    }

    setIsProcessing(true)
    setStatus({ type: 'loading', message: 'Encoding facial features...' })

    try {
      await new Promise(r => setTimeout(r, 800)) // UX delay

      const descriptor = Array.from(detectedFace.descriptor)
      const newFace = {
        id: Date.now(),
        name: registerName.trim(),
        descriptor,
        registeredAt: new Date().toISOString(),
        expression: detectedFace.expressions ? 
          Object.entries(detectedFace.expressions)
            .sort((a, b) => b[1] - a[1])[0][0] : 'neutral'
      }

      const updated = [...registeredFaces, newFace]
      setRegisteredFaces(updated)
      localStorage.setItem('neuralgate_faces', JSON.stringify(updated))

      setRegisterName('')
      setStatus({ type: 'success', message: `Face registered for "${newFace.name}" ✓` })
      addNotification(`Face registered for ${newFace.name}!`, 'success')
      setMode('idle')
    } catch (err) {
      console.error('Registration error:', err)
      setStatus({ type: 'error', message: 'Registration failed. Try again.' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Login with face
  const handleLogin = async () => {
    if (registeredFaces.length === 0) {
      setStatus({ type: 'error', message: 'No registered faces. Register first.' })
      return
    }
    if (!detectedFace) {
      setStatus({ type: 'error', message: 'No face detected. Look at the camera.' })
      return
    }

    setIsProcessing(true)
    setStatus({ type: 'loading', message: 'Matching face against database...' })

    try {
      await new Promise(r => setTimeout(r, 600))

      const labeledDescriptors = registeredFaces.map(f =>
        new faceapi.LabeledFaceDescriptors(
          f.name,
          [new Float32Array(f.descriptor)]
        )
      )

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5)
      const match = faceMatcher.findBestMatch(detectedFace.descriptor)

      if (match.label !== 'unknown') {
        setMatchResult({
          name: match.label,
          distance: match.distance,
          confidence: ((1 - match.distance) * 100).toFixed(1)
        })
        setStatus({ type: 'success', message: `Authenticated as ${match.label}!` })

        setTimeout(() => {
          login({
            name: match.label,
            confidence: ((1 - match.distance) * 100).toFixed(1),
            method: 'face',
            loginTime: new Date().toISOString()
          })
        }, 1500)
      } else {
        setMatchResult({ name: 'unknown', distance: match.distance, confidence: 0 })
        setStatus({ type: 'error', message: 'Face not recognized. Register first.' })
        addNotification('Authentication failed — face not recognized', 'error')
      }
    } catch (err) {
      console.error('Login error:', err)
      setStatus({ type: 'error', message: 'Authentication failed.' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Delete face
  const deleteFace = (id) => {
    const updated = registeredFaces.filter(f => f.id !== id)
    setRegisteredFaces(updated)
    localStorage.setItem('neuralgate_faces', JSON.stringify(updated))
    addNotification('Face removed from database', 'info')
  }

  const statusIcons = {
    idle: null,
    loading: <Loader2 className="spin" size={16} />,
    success: <CheckCircle2 size={16} />,
    error: <AlertCircle size={16} />,
  }

  return (
    <div className="faceauth-page">
      <div className="faceauth-container">
        {/* Left Side — Camera */}
        <div className="faceauth-camera-section">
          <div className="section-label">
            <Scan size={16} />
            <span>Face Detection — Live Feed</span>
          </div>

          <div className="camera-viewport">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`camera-video ${cameraOn ? 'active' : ''}`}
              onLoadedMetadata={() => {
                if (canvasRef.current && videoRef.current) {
                  canvasRef.current.width = videoRef.current.videoWidth
                  canvasRef.current.height = videoRef.current.videoHeight
                }
              }}
            />
            <canvas ref={canvasRef} className="camera-overlay" />

            {!cameraOn && (
              <div className="camera-placeholder">
                <CameraOff size={48} strokeWidth={1} />
                <p>Camera is off</p>
                <span>Enable camera and load models to begin</span>
              </div>
            )}

            {/* Detection indicators */}
            {cameraOn && (
              <div className="camera-hud">
                <div className={`hud-indicator ${detectedFace ? 'detected' : 'scanning'}`}>
                  <span className={`status-dot ${detectedFace ? 'active' : 'warning'}`} />
                  <span>{detectedFace ? 'Face Detected' : 'Scanning...'}</span>
                </div>
                {detectedFace && detectedFace.expressions && (
                  <div className="hud-expression">
                    {Object.entries(detectedFace.expressions)
                      .sort((a, b) => b[1] - a[1])[0][0]}
                  </div>
                )}
              </div>
            )}

            {/* Scan corners */}
            {cameraOn && (
              <>
                <div className="viewport-corner v-tl" />
                <div className="viewport-corner v-tr" />
                <div className="viewport-corner v-bl" />
                <div className="viewport-corner v-br" />
              </>
            )}
          </div>

          {/* Camera Controls */}
          <div className="camera-controls">
            {!modelsLoaded ? (
              <motion.button
                className="btn btn-primary btn-lg"
                onClick={loadModels}
                disabled={loadingModels}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%' }}
              >
                {loadingModels ? (
                  <>
                    <Loader2 className="spin" size={18} />
                    <span>Loading Models ({loadProgress.toFixed(0)}%)</span>
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    <span>Load AI Models</span>
                  </>
                )}
              </motion.button>
            ) : (
              <div className="control-row">
                <motion.button
                  className={`btn ${cameraOn ? 'btn-danger' : 'btn-success'} `}
                  onClick={cameraOn ? stopCamera : startCamera}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {cameraOn ? <CameraOff size={18} /> : <Camera size={18} />}
                  <span>{cameraOn ? 'Stop Camera' : 'Start Camera'}</span>
                </motion.button>
              </div>
            )}

            {loadingModels && (
              <div className="progress-bar" style={{ marginTop: 12 }}>
                <div className="progress-bar-fill" style={{ width: `${loadProgress}%` }} />
              </div>
            )}
          </div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {status.message && (
              <motion.div
                key={status.message}
                className={`status-bar status-${status.type}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {statusIcons[status.type]}
                <span>{status.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side — Controls */}
        <div className="faceauth-controls-section">
          {/* Mode Selector */}
          <div className="mode-selector">
            <motion.button
              className={`mode-btn ${mode === 'register' ? 'active register' : ''}`}
              onClick={() => setMode('register')}
              disabled={!cameraOn || !modelsLoaded}
              whileTap={{ scale: 0.97 }}
            >
              <UserPlus size={18} />
              <span>Register</span>
            </motion.button>
            <motion.button
              className={`mode-btn ${mode === 'login' ? 'active login' : ''}`}
              onClick={() => setMode('login')}
              disabled={!cameraOn || !modelsLoaded}
              whileTap={{ scale: 0.97 }}
            >
              <LogIn size={18} />
              <span>Authenticate</span>
            </motion.button>
          </div>

          {/* Register Panel */}
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                className="auth-panel glass-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3>
                  <UserPlus size={20} />
                  Register New Face
                </h3>
                <p className="panel-desc">
                  Enter your name and look directly at the camera when your face is detected.
                </p>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your name..."
                  value={registerName}
                  onChange={e => setRegisterName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                />
                <motion.button
                  className="btn btn-primary"
                  onClick={handleRegister}
                  disabled={isProcessing || !detectedFace}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%' }}
                >
                  {isProcessing ? (
                    <><Loader2 className="spin" size={18} /><span>Processing...</span></>
                  ) : (
                    <><Scan size={18} /><span>Capture & Register</span></>
                  )}
                </motion.button>
              </motion.div>
            )}

            {mode === 'login' && (
              <motion.div
                className="auth-panel glass-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3>
                  <Shield size={20} />
                  Face Authentication
                </h3>
                <p className="panel-desc">
                  Look at the camera. Your face will be matched against {registeredFaces.length} registered face(s).
                </p>
                <motion.button
                  className="btn btn-success"
                  onClick={handleLogin}
                  disabled={isProcessing || !detectedFace || registeredFaces.length === 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%' }}
                >
                  {isProcessing ? (
                    <><Loader2 className="spin" size={18} /><span>Matching...</span></>
                  ) : (
                    <><Eye size={18} /><span>Authenticate Now</span></>
                  )}
                </motion.button>

                {/* Match Result */}
                {matchResult && (
                  <motion.div
                    className={`match-result ${matchResult.name !== 'unknown' ? 'success' : 'fail'}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {matchResult.name !== 'unknown' ? (
                      <>
                        <CheckCircle2 size={24} />
                        <div>
                          <strong>Authenticated: {matchResult.name}</strong>
                          <span>Confidence: {matchResult.confidence}%</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={24} />
                        <div>
                          <strong>Not Recognized</strong>
                          <span>Please register your face first</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {mode === 'idle' && cameraOn && modelsLoaded && (
              <motion.div
                className="auth-panel glass-card idle-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Eye size={32} strokeWidth={1} />
                <h3>Select an Action</h3>
                <p>Choose <strong>Register</strong> to add a new face or <strong>Authenticate</strong> to log in.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registered Faces List */}
          <div className="registered-section">
            <div className="registered-header">
              <h4>
                <Users size={16} />
                Registered Faces ({registeredFaces.length})
              </h4>
              {registeredFaces.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setRegisteredFaces([])
                    localStorage.removeItem('neuralgate_faces')
                    addNotification('All faces cleared', 'info')
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="faces-list">
              {registeredFaces.length === 0 ? (
                <div className="no-faces">
                  <p>No faces registered yet</p>
                </div>
              ) : (
                registeredFaces.map((face, i) => (
                  <motion.div
                    key={face.id}
                    className="face-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="face-item-avatar">
                      {face.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="face-item-info">
                      <strong>{face.name}</strong>
                      <span>{new Date(face.registeredAt).toLocaleDateString()}</span>
                    </div>
                    <span className="badge badge-green">{face.expression}</span>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => deleteFace(face.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
