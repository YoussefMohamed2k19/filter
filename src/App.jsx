import { useState, useRef, useEffect } from 'react'

function App() {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingCamera, setIsLoadingCamera] = useState(false)
  const [error, setError] = useState(null)
  const [streamReady, setStreamReady] = useState(false)
  const [facingMode, setFacingMode] = useState('user') // 'user' for front, 'environment' for back
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async (facing = facingMode) => {
    setIsLoadingCamera(true)
    setError(null)
    setIsCameraOpen(true) // Show video element first
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      // Use minimal constraints to avoid zooming in on mobile
      // Let it use natural field of view
      // Don't request aspect ratio or resolution as these cause digital zoom
      const constraints = {
        video: { 
          facingMode: facing
          // No aspect ratio or resolution constraints to prevent zoom
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      streamRef.current = stream
      setStreamReady(true)
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      setIsLoadingCamera(false)
      setIsCameraOpen(false)
      setError(error.message || 'Unable to access camera. Please check permissions and ensure you are using HTTPS or localhost.')
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }

  // Effect to handle video stream when ready
  useEffect(() => {
    if (streamReady && streamRef.current && videoRef.current) {
      const video = videoRef.current
      video.srcObject = streamRef.current
      
      // Try to play immediately
      video.play()
        .then(() => {
          setIsLoadingCamera(false)
        })
        .catch((playError) => {
          console.warn('Initial play failed, waiting for video to be ready:', playError)
          const handleCanPlay = () => {
            setIsLoadingCamera(false)
            video.removeEventListener('canplay', handleCanPlay)
          }
          video.addEventListener('canplay', handleCanPlay, { once: true })
          
          // Fallback: stop loading after 1 second regardless
          setTimeout(() => {
            setIsLoadingCamera(false)
          }, 1000)
        })
    }
  }, [streamReady])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOpen(false)
    setStreamReady(false)
  }

  const switchCamera = async () => {
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreamReady(false)
    
    // Switch facing mode
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacingMode)
    
    // Start camera with new facing mode
    await startCamera(newFacingMode)
  }

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas to target size (1080x1920)
    canvas.width = 1080
    canvas.height = 1920

    // Calculate aspect ratio to fit video into canvas
    const videoAspect = video.videoWidth / video.videoHeight
    const canvasAspect = canvas.width / canvas.height

    let drawWidth, drawHeight, drawX, drawY

    if (videoAspect > canvasAspect) {
      // Video is wider - fit to height
      drawHeight = canvas.height
      drawWidth = drawHeight * videoAspect
      drawX = (canvas.width - drawWidth) / 2
      drawY = 0
    } else {
      // Video is taller - fit to width
      drawWidth = canvas.width
      drawHeight = drawWidth / videoAspect
      drawX = 0
      drawY = (canvas.height - drawHeight) / 2
    }

    // Draw video frame - mirror it horizontally only for front camera to match the preview
    // The preview shows mirrored video (scaleX(-1)) for front camera, so we mirror the capture too
    if (facingMode === 'user') {
      // Method: flip the context, draw, then restore
      ctx.save()
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      // Draw at flipped position: original drawX becomes canvas.width - drawX - drawWidth
      ctx.drawImage(video, canvas.width - drawX - drawWidth, drawY, drawWidth, drawHeight)
      ctx.restore()
    } else {
      // Back camera - no mirroring needed
      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight)
    }

    // Create frame image and overlay it
    const frameImg = new Image()
    frameImg.crossOrigin = 'anonymous'
    frameImg.onload = () => {
      // Draw frame overlay covering the entire canvas
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height)
      
      // Convert to image data URL
      const imageDataUrl = canvas.toDataURL('image/png')
      setCapturedImage(imageDataUrl)
      stopCamera()
    }
    frameImg.src = '/frame.png'
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const downloadImage = async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    
    try {
      // Create a new canvas to ensure exact dimensions
      const downloadCanvas = document.createElement('canvas')
      downloadCanvas.width = 1080
      downloadCanvas.height = 1920
      const ctx = downloadCanvas.getContext('2d')

      // Load the captured image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1080, 1920)
          resolve()
        }
        img.onerror = reject
        img.src = capturedImage
      })

      // Convert to blob and download
      downloadCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `world-diabetes-day-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setIsProcessing(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error downloading image:', error)
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#87a5ca' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>World Diabetes Day</h1>
          <p style={{ color: '#ffffff' }}>Take a selfie with our frame</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Camera View */}
          {!capturedImage && (
            <div className="relative">
              {isCameraOpen ? (
                <div className="relative aspect-[9/16] bg-black overflow-hidden rounded-lg">
                  {isLoadingCamera && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                      <div className="text-center">
                        <svg className="animate-spin h-12 w-12 text-white mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-white text-sm">Starting camera...</p>
                      </div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  {/* Frame guide overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-2 border-2 border-white rounded-lg opacity-50"></div>
                    {/* Corner guides */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white opacity-70"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white opacity-70"></div>
                    <div className="absolute bottom-20 left-4 w-8 h-8 border-b-2 border-l-2 border-white opacity-70"></div>
                    <div className="absolute bottom-20 right-4 w-8 h-8 border-b-2 border-r-2 border-white opacity-70"></div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-20">
                    <button
                      onClick={stopCamera}
                      className="px-6 py-3 backdrop-blur-sm text-white rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                      style={{ backgroundColor: 'rgba(135, 165, 202, 0.8)' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(135, 165, 202, 1)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(135, 165, 202, 0.8)'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureSelfie}
                      className="w-16 h-16 bg-white rounded-full border-4 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95"
                    >
                      <div className="w-12 h-12 bg-white rounded-full border-2 border-gray-300 group-active:bg-gray-100 transition-colors"></div>
                    </button>
                    <button
                      onClick={switchCamera}
                      disabled={isLoadingCamera}
                      className="px-6 py-3 backdrop-blur-sm text-white rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(135, 165, 202, 0.8)' }}
                      onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'rgba(135, 165, 202, 1)')}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(135, 165, 202, 0.8)'}
                      title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[9/16] bg-gray-100 flex items-center justify-center">
                  <div className="text-center p-8 w-full">
                    {error ? (
                      <div className="mb-6">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#cd473f' }}>
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm mb-4 px-4" style={{ color: '#cd473f' }}>{error}</p>
                        <button
                          onClick={startCamera}
                          className="px-6 py-3 text-white rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                          style={{ backgroundColor: '#cd473f' }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ backgroundColor: '#cd473f' }}>
                          {isLoadingCamera ? (
                            <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </div>
                        <button
                          onClick={startCamera}
                          disabled={isLoadingCamera}
                          className="px-8 py-4 text-white rounded-full font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          style={{ backgroundColor: '#cd473f' }}
                          onMouseEnter={(e) => !e.target.disabled && (e.target.style.opacity = '0.9')}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          {isLoadingCamera ? 'Opening Camera...' : 'Open Camera'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview with Frame */}
          {capturedImage && (
            <div className="relative">
              <div className="aspect-[9/16] bg-black relative overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured selfie with frame"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                <button
                  onClick={retakePhoto}
                  className="px-6 py-3 text-white rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#87a5ca' }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  Retake
                </button>
                <button
                  onClick={downloadImage}
                  disabled={isProcessing}
                  className="px-6 py-3 text-white rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: '#cd473f' }}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.opacity = '0.9')}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

export default App

