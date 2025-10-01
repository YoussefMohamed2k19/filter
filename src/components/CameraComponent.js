import React, { useRef, useEffect, useState } from 'react';

const CameraComponent = ({ onPhotoCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera for selfies
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        setIsStreaming(true);
      };
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Stop camera and capture photo
    stopCamera();
    onPhotoCapture(photoDataUrl);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-auto max-h-96 object-cover"
          playsInline
          muted
        />
        
        {!isStreaming && !error && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
            <div className="text-white text-center p-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-semibold mb-2">Camera Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Camera overlay with grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid grid-cols-3 grid-rows-3 h-full">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white border-opacity-30"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-500 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors duration-200"
          >
            Cancel
          </button>
          
          <button
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="px-8 py-3 bg-gradient-to-r from-teal-primary to-magenta-primary text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Capture</span>
            </div>
          </button>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraComponent;

