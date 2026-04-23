import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision'
import {
  Hand,
  Camera,
  CameraOff,
  Power,
  Volume2,
  Sun,
  Monitor,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react'
import './GestureControl.css'

export default function GestureControl() {
  const { addNotification } = useAppContext()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const recognizerRef = useRef(null)
  const requestRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [currentGesture, setCurrentGesture] = useState('None')
  const [statusTimer, setStatusTimer] = useState(null)
  const [systemState, setSystemState] = useState({
    power: true,
    volume: 50,
    brightness: 80,
    activeApp: 'Dashboard'
  })

  // Load MediaPipe Gesture Recognizer
  const initializeRecognizer = async () => {
    setLoading(true)
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      )
      
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1
      })
      
      recognizerRef.current = recognizer
      setReady(true)
      addNotification('Gesture AI loaded via MediaPipe', 'success')
    } catch (err) {
      console.error('Failed to load recognizer:', err)
      addNotification('Failed to load gesture model', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle detected gesture
  const handleGestureAction = useCallback((gesture) => {
    if (gesture === currentGesture || gesture === 'None') return
    
    setCurrentGesture(gesture)
    
    setSystemState(prev => {
      const newState = { ...prev }
      let actionMsg = ''

      switch (gesture) {
        case 'Open_Palm':
          newState.power = true
          actionMsg = 'System Powered ON'
          break
        case 'Closed_Fist':
          newState.power = false
          actionMsg = 'System Powered OFF'
          break
        case 'Thumb_Up':
          if (newState.power) {
            newState.volume = Math.min(100, newState.volume + 10)
            actionMsg = `Volume Up: ${newState.volume}%`
          }
          break
        case 'Thumb_Down':
          if (newState.power) {
            newState.volume = Math.max(0, newState.volume - 10)
            actionMsg = `Volume Down: ${newState.volume}%`
          }
          break
        case 'Pointing_Up':
          if (newState.power) {
            newState.brightness = Math.min(100, newState.brightness + 10)
            actionMsg = `Brightness Up: ${newState.brightness}%`
          }
          break
        case 'ILoveYou':
          if (newState.power) {
            actionMsg = 'Screen Locked'
            newState.activeApp = 'Locked'
          }
          break
      }

      if (actionMsg) {
        // Debounce notifications slightly
        clearTimeout(statusTimer)
        const t = setTimeout(() => addNotification(actionMsg, 'info'), 300)
        setStatusTimer(t)
      }

      return newState
    })
  }, [currentGesture, statusTimer, addNotification])

  // Process Video Frame
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !recognizerRef.current || !cameraOn) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (video.currentTime !== processFrame.lastVideoTime) {
      processFrame.lastVideoTime = video.currentTime

      const results = recognizerRef.current.recognizeForVideo(video, performance.now())
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (results.landmarks && results.landmarks.length > 0) {
        const drawingUtils = new DrawingUtils(ctx)
        
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: 'rgba(0, 212, 255, 0.4)', lineWidth: 3 }
          )
          drawingUtils.drawLandmarks(landmarks, {
            color: '#8b5cf6',
            lineWidth: 2,
            radius: 4
          })
        }

        if (results.gestures && results.gestures.length > 0) {
          const cat = results.gestures[0][0].categoryName
          handleGestureAction(cat)
        }
      } else {
        handleGestureAction('None')
      }
    }
    
    if (cameraOn) {
      requestRef.current = requestAnimationFrame(processFrame)
    }
  }, [cameraOn, handleGestureAction])

  // Camera Management
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraOn(true)
        addNotification('Camera activated', 'success')
      }
    } catch (err) {
      console.error(err)
      addNotification('Camera access denied', 'error')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }
    setCameraOn(false)
    setCurrentGesture('None')
  }

  useEffect(() => {
    if (cameraOn && ready) {
      // Need a slight delay to ensure video dimensions are set
      setTimeout(() => {
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
        }
        processFrame()
      }, 500)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [cameraOn, ready, processFrame])

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera()
      if (recognizerRef.current) {
        recognizerRef.current.close()
      }
    }
  }, [])

  const gestureMap = {
    'None': 'Waiting for gesture...',
    'Closed_Fist': '✊ System OFF',
    'Open_Palm': '✋ System ON',
    'Pointing_Up': '☝️ Brightness Up',
    'Thumb_Down': '👎 Volume Down',
    'Thumb_Up': '👍 Volume Up',
    'Victory': '✌️ Custom Action',
    'ILoveYou': '🤟 Lock Screen'
  }

  return (
    <div className="gesture-page">
      <div className="gesture-container">
        
        {/* Visualizer Area */}
        <div className="gesture-visualizer glass-card">
          <div className="section-label">
            <Hand size={18} />
            <span>Hand Tracking via MediaPipe</span>
          </div>

          <div className="camera-viewport">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`camera-video ${cameraOn ? 'active' : ''}`}
            />
            <canvas ref={canvasRef} className="camera-overlay" />
            
            {!cameraOn && (
              <div className="camera-placeholder">
                <CameraOff size={48} strokeWidth={1} />
                <p>Camera inactive</p>
                <span>Initialize AI & start camera to begin</span>
              </div>
            )}
            
            {cameraOn && (
              <div className="gesture-hud">
                <div className="current-gesture-badge">
                  {gestureMap[currentGesture] || currentGesture}
                </div>
              </div>
            )}
          </div>

          <div className="controls">
            {!ready ? (
              <motion.button 
                className="btn btn-primary"
                onClick={initializeRecognizer}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
                <span>{loading ? 'Downloading Math Models...' : 'Initialize AI Model'}</span>
              </motion.button>
            ) : (
              <motion.button 
                className={`btn ${cameraOn ? 'btn-danger' : 'btn-success'}`}
                onClick={cameraOn ? stopCamera : startCamera}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {cameraOn ? <CameraOff size={18} /> : <Camera size={18} />}
                <span>{cameraOn ? 'Stop Camera' : 'Start Camera'}</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* System Simulation Area */}
        <div className="system-sim glass-card flex-col">
          <div className="section-label">
            <Monitor size={18} />
            <span>Virtual System Simulator</span>
          </div>
          
          <div className={`simulator-screen ${!systemState.power ? 'power-off' : ''}`}>
            {!systemState.power ? (
              <div className="off-state">
                <Power size={48} />
                <p>System Powered Down</p>
                <span>Use 'Open Palm' ✋ to wake</span>
              </div>
            ) : (
              <div className="on-state">
                <div className="sim-app-window">
                  <h3>{systemState.activeApp}</h3>
                  <div className="sim-content">
                    {systemState.activeApp === 'Locked' && (
                      <div className="locked-msg">
                        <AlertCircle size={32} />
                        <p>System Locked</p>
                        <small>Switch gesture to return</small>
                      </div>
                    )}
                    {systemState.activeApp === 'Dashboard' && (
                      <div className="dashboard-sim">
                        <div className="sim-bar" style={{ width: '80%' }}/>
                        <div className="sim-bar" style={{ width: '60%' }}/>
                        <div className="sim-bar" style={{ width: '90%' }}/>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sim-metrics">
                  <div className="metric">
                    <Volume2 size={16} />
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${systemState.volume}%` }}/>
                    </div>
                    <span>{systemState.volume}%</span>
                  </div>
                  <div className="metric">
                    <Sun size={16} />
                    <div className="progress-bar">
                      <div className="progress-bar-fill bg-cyan" style={{ width: `${systemState.brightness}%` }}/>
                    </div>
                    <span>{systemState.brightness}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="gesture-guide">
            <h4>Control Guide</h4>
            <div className="guide-grid">
              <div className="guide-item">
                <span className="emoji">✋</span>
                <span className="desc">Power ON</span>
              </div>
              <div className="guide-item">
                <span className="emoji">✊</span>
                <span className="desc">Power OFF</span>
              </div>
              <div className="guide-item">
                <span className="emoji">👍</span>
                <span className="desc">Vol UP</span>
              </div>
              <div className="guide-item">
                <span className="emoji">👎</span>
                <span className="desc">Vol DOWN</span>
              </div>
              <div className="guide-item">
                <span className="emoji">☝️</span>
                <span className="desc">Brightness</span>
              </div>
              <div className="guide-item">
                <span className="emoji">🤟</span>
                <span className="desc">Lock</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
