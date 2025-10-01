import React, { useState, useRef, useEffect } from 'react';
import CameraComponent from './components/CameraComponent';
import PhotoPreview from './components/PhotoPreview';

function App() {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handlePhotoCapture = (photoDataUrl) => {
    setCapturedPhoto(photoDataUrl);
    setIsCameraActive(false);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setIsCameraActive(true);
  };

  const handleNewPhoto = () => {
    setCapturedPhoto(null);
    setIsCameraActive(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Web Filter Camera
          </h1>
          <p className="text-gray-600 text-lg">
            Capture beautiful photos with gradient frames
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {!capturedPhoto && !isCameraActive && (
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-teal-primary to-magenta-primary rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Ready to Capture
                </h2>
                <p className="text-gray-600 mb-6">
                  Take a photo and it will be automatically framed with our beautiful gradient design and community logo.
                </p>
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="bg-gradient-to-r from-teal-primary to-magenta-primary text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Start Camera
                </button>
              </div>
            </div>
          )}

          {isCameraActive && (
            <CameraComponent
              onPhotoCapture={handlePhotoCapture}
              onCancel={() => setIsCameraActive(false)}
            />
          )}

          {capturedPhoto && (
            <PhotoPreview
              photoDataUrl={capturedPhoto}
              onRetake={handleRetakePhoto}
              onNewPhoto={handleNewPhoto}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

