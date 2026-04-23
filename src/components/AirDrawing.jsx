import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision'
import {
  PenTool,
  Camera,
  CameraOff,
  Trash2,
  Download,
  RefreshCw,
  Loader2,
  Palette
} from 'lucide-react'
import './AirDrawing.css'

export default function AirDrawing() {
  const { addNotification } = useAppContext()
  const videoRef = useRef(null)
  const cameraOverlayRef = useRef(null)
  const drawingCanvasRef = useRef(null)
  const streamRef = useRef(null)
  const recognizerRef = useRef(null)
  const requestRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [colorIndex, setColorIndex] = useState(0)
  const [brushSize, setBrushSize] = useState(6)
  const [isEraser, setIsEraser] = useState(false)

  // Neon colors for drawing
  const colors = [
    '#00d4ff', // Cyan
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#10b981', // Green
    '#f59e0b', // Orange
  ]

  const lastPointRef = useRef(null)

  // Load MediaPipe Hand Tracker
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
      addNotification('Air Drawing AI loaded', 'success')
    } catch (err) {
      console.error('Failed to load recognizer:', err)
      addNotification('Failed to load gesture model', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Draw on the persistent canvas
  const drawLine = (ctx, x, y, isDrawing) => {
    if (!isDrawing) {
      lastPointRef.current = null
      return
    }

    const currentColor = colors[colorIndex]

    if (lastPointRef.current) {
      ctx.beginPath()
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
      ctx.lineTo(x, y)
      
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = brushSize * 4
        ctx.shadowBlur = 0
        ctx.strokeStyle = 'rgba(0,0,0,1)'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = currentColor
        ctx.lineWidth = brushSize
        ctx.shadowBlur = 15
        ctx.shadowColor = currentColor
      }
      
      ctx.stroke()
    }

    lastPointRef.current = { x, y }
  }

  // Process Video Frame
  const processFrame = useCallback(() => {
    if (!videoRef.current || !cameraOverlayRef.current || !drawingCanvasRef.current || !recognizerRef.current || !cameraOn) return

    const video = videoRef.current
    const overlayCanvas = cameraOverlayRef.current
    const drawCanvas = drawingCanvasRef.current
    const overlayCtx = overlayCanvas.getContext('2d')
    const drawCtx = drawCanvas.getContext('2d')
    
    if (video.currentTime !== processFrame.lastVideoTime) {
      processFrame.lastVideoTime = video.currentTime

      const results = recognizerRef.current.recognizeForVideo(video, performance.now())
      
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      
      let drawingActive = false

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]
        const drawingUtils = new DrawingUtils(overlayCtx)
        
        // Draw hand skeleton on the overlay canvas
        drawingUtils.drawConnectors(
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS,
          { color: 'rgba(255, 255, 255, 0.2)', lineWidth: 2 }
        )
        drawingUtils.drawLandmarks(landmarks, {
          color: 'rgba(255, 255, 255, 0.5)',
          lineWidth: 1,
          radius: 2
        })

        // Pinch detection for drawing
        const thumbTip = landmarks[4]
        const indexTip = landmarks[8]
        
        const dx = thumbTip.x - indexTip.x
        const dy = thumbTip.y - indexTip.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Pinch distance threshold (approx 0.05 normalized distance)
        if (distance < 0.06) {
          drawingActive = true
        }

        setIsDrawingMode(drawingActive)

        // Midpoint of pinch
        const midX = (thumbTip.x + indexTip.x) / 2
        const midY = (thumbTip.y + indexTip.y) / 2
        
        // Convert normalized coordinates to canvas coordinates
        // Note: Canvas is flipped horizontally via CSS, so we flip the X coordinate here
        const x = (1 - midX) * drawCanvas.width
        const y = midY * drawCanvas.height

        // Draw cursor on overlay
        overlayCtx.beginPath()
        overlayCtx.arc((1 - midX) * overlayCanvas.width, midY * overlayCanvas.height, isEraser ? brushSize * 2 : Math.max(8, brushSize), 0, 2 * Math.PI)
        overlayCtx.fillStyle = drawingActive ? (isEraser ? 'rgba(255,255,255,0.8)' : colors[colorIndex]) : 'rgba(255,255,255,0.5)'
        overlayCtx.fill()
        if (drawingActive && !isEraser) {
          overlayCtx.shadowBlur = 20
          overlayCtx.shadowColor = colors[colorIndex]
        }
        overlayCtx.shadowBlur = 0

        // Draw line on the persistent canvas
        drawLine(drawCtx, x, y, drawingActive)

      } else {
        setIsDrawingMode(false)
        drawLine(drawCtx, 0, 0, false)
      }
    }
    
    if (cameraOn) {
      requestRef.current = requestAnimationFrame(processFrame)
    }
  }, [cameraOn, colorIndex, colors, brushSize, isEraser])

  // Camera Management
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
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
    setIsDrawingMode(false)
  }

  useEffect(() => {
    if (cameraOn && ready) {
      setTimeout(() => {
        if (cameraOverlayRef.current && videoRef.current && drawingCanvasRef.current) {
          cameraOverlayRef.current.width = videoRef.current.videoWidth
          cameraOverlayRef.current.height = videoRef.current.videoHeight
          drawingCanvasRef.current.width = videoRef.current.videoWidth
          drawingCanvasRef.current.height = videoRef.current.videoHeight
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

  const clearCanvas = () => {
    if (drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      addNotification('Canvas cleared', 'info')
    }
  }

  const downloadArtwork = () => {
    if (drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current
      // Create a temporary canvas to merge black background and drawing
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const ctx = tempCanvas.getContext('2d')
      
      // Fill dark background
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      // Draw the neon lines
      ctx.drawImage(canvas, 0, 0)

      const dataUrl = tempCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `neuralgate-air-drawing-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      addNotification('Artwork downloaded!', 'success')
    }
  }

  return (
    <div className="airdrawing-page">
      <div className="airdrawing-container">
        
        {/* Header Area */}
        <div className="airdrawing-header">
          <div>
            <h1>Air Drawing Studio</h1>
            <p>Pinch your thumb and index finger to draw in mid-air. Tracked by neural network in real-time.</p>
          </div>
          <div className="controls-row">
            {!ready ? (
              <motion.button 
                className="btn btn-primary"
                onClick={initializeRecognizer}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <Loader2 className="spin" size={18} /> : <PenTool size={18} />}
                <span>{loading ? 'Loading Engine...' : 'Initialize Studio'}</span>
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

        {/* Main Workspace */}
        <div className="workspace-card glass-card">
          <div className="canvas-wrapper">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`camera-video ${cameraOn ? 'active' : ''}`}
            />
            {/* Overlay for skeletal tracking (flipped via CSS) */}
            <canvas ref={cameraOverlayRef} className="canvas-layer overlay-layer" />
            
            {/* Persistent canvas for drawing (NOT flipped via CSS, we flip coordinates in JS) */}
            <canvas ref={drawingCanvasRef} className="canvas-layer drawing-layer" />
            
            {!cameraOn && (
              <div className="camera-placeholder">
                <PenTool size={48} strokeWidth={1} />
                <p>Studio Inactive</p>
                <span>Start camera to begin air drawing</span>
              </div>
            )}

            {cameraOn && (
              <div className="drawing-hud">
                <div className={`status-badge ${isDrawingMode ? 'active' : ''}`}>
                  <span className="status-dot"></span>
                  {isDrawingMode ? (isEraser ? 'Erasing...' : 'Drawing...') : 'Hovering (Pinch thumb & index to draw)'}
                </div>
              </div>
            )}
          </div>

          {/* Tools Panel */}
          <div className="tools-panel">
            <div className="tools-top-row">
              <div className="tools-group">
                <span className="tools-label"><Palette size={16}/> Tools</span>
                <div className="color-picker">
                  {colors.map((color, idx) => (
                    <button
                      key={idx}
                      className={`color-btn ${colorIndex === idx && !isEraser ? 'active' : ''}`}
                      style={{ backgroundColor: color, boxShadow: colorIndex === idx && !isEraser ? `0 0 15px ${color}` : 'none' }}
                      onClick={() => {
                        setColorIndex(idx)
                        setIsEraser(false)
                      }}
                      title="Brush Color"
                    />
                  ))}
                  <button
                    className={`tool-btn ${isEraser ? 'active' : ''}`}
                    onClick={() => setIsEraser(true)}
                    title="Eraser"
                  >
                    <div className="eraser-icon" />
                  </button>
                </div>
              </div>

              <div className="tools-group size-group">
                <span className="tools-label">Size: {brushSize}px</span>
                <input 
                  type="range" 
                  min="2" 
                  max="20" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="size-slider"
                />
              </div>
            </div>

            <div className="tools-actions">
              <button 
                className="btn btn-secondary" 
                onClick={clearCanvas}
                disabled={!cameraOn}
              >
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
              <button 
                className="btn btn-primary" 
                onClick={downloadArtwork}
                disabled={!cameraOn}
              >
                <Download size={16} />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
