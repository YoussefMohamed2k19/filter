import { useState, useRef, useEffect } from 'react'

function App() {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingCamera, setIsLoadingCamera] = useState(false)
  const [error, setError] = useState(null)
  const [streamReady, setStreamReady] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    setIsLoadingCamera(true)
    setError(null)
    setIsCameraOpen(true) // Show video element first
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      // Use simple constraints to avoid zooming in on mobile
      // Don't force high resolution which causes cameras to zoom
      const constraints = {
        video: { 
          facingMode: 'user',
          // Request portrait orientation but let camera choose resolution
          aspectRatio: { ideal: 9/16 }
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

    // Draw video frame
    // Note: CSS transform on video is only for preview, canvas captures original stream
    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight)

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
        link.download = `marketing-campaign-${Date.now()}.png`
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Marketing Campaign</h1>
          <p className="text-gray-600">Take a selfie with our frame</p>
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
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
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
                      className="px-6 py-3 bg-gray-800 bg-opacity-80 backdrop-blur-sm text-white rounded-full font-semibold hover:bg-opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureSelfie}
                      className="w-16 h-16 bg-white rounded-full border-4 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95"
                    >
                      <div className="w-12 h-12 bg-white rounded-full border-2 border-gray-300 group-active:bg-gray-100 transition-colors"></div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[9/16] bg-gray-100 flex items-center justify-center">
                  <div className="text-center p-8 w-full">
                    {error ? (
                      <div className="mb-6">
                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-red-600 text-sm mb-4 px-4">{error}</p>
                        <button
                          onClick={startCamera}
                          className="px-6 py-3 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-all duration-200 shadow-lg"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
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
                          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  className="px-6 py-3 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Retake
                </button>
                <button
                  onClick={downloadImage}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

