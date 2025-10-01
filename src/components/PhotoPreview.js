import React, { useRef, useState } from 'react';

const PhotoPreview = ({ photoDataUrl, onRetake, onNewPhoto }) => {
  const canvasRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadPhoto = async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);
    
    try {
      // Create a new canvas for the final image with frame and logo
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      const framePadding = 40;
      
      canvas.width = 800;
      canvas.height = 600;
      
      // Create gradient background for frame
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#0c8596');
      gradient.addColorStop(1, '#a3216e');
      
      // Draw gradient frame background
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw white inner area
      ctx.fillStyle = 'white';
      ctx.fillRect(framePadding, framePadding, canvas.width - (framePadding * 2), canvas.height - (framePadding * 2));
      
      // Load and draw the original photo
      const img = new Image();
      img.onload = () => {
        // Calculate photo dimensions to fit in the white area
        const photoAreaWidth = canvas.width - (framePadding * 2);
        const photoAreaHeight = canvas.height - (framePadding * 2);
        
        const photoAspectRatio = img.width / img.height;
        const areaAspectRatio = photoAreaWidth / photoAreaHeight;
        
        let photoWidth, photoHeight, photoX, photoY;
        
        if (photoAspectRatio > areaAspectRatio) {
          // Photo is wider, fit to width
          photoWidth = photoAreaWidth;
          photoHeight = photoWidth / photoAspectRatio;
          photoX = framePadding;
          photoY = framePadding + (photoAreaHeight - photoHeight) / 2;
        } else {
          // Photo is taller, fit to height
          photoHeight = photoAreaHeight;
          photoWidth = photoHeight * photoAspectRatio;
          photoX = framePadding + (photoAreaWidth - photoWidth) / 2;
          photoY = framePadding;
        }
        
        // Draw the photo
        ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight);
        
        // Load and draw the PNG logo
        const logoImg = new Image();
        logoImg.onload = () => {
          console.log('Canvas logo loaded successfully');
          // Draw the PNG logo
          const logoWidth = 200;
          const logoHeight = 60;
          const logoX = canvas.width / 2 - logoWidth / 2;
          const logoY = framePadding + 20;
          
          ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
          
          // Convert to blob and download
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `web-filter-photo-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsProcessing(false);
          }, 'image/jpeg', 0.9);
        };
        
        logoImg.onerror = () => {
          console.log('Canvas logo failed to load, using text fallback');
          // Draw text logo as fallback
          drawCommunityLogo(ctx, canvas.width / 2, framePadding + 50, 200, 60);
          
          // Convert to blob and download
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `web-filter-photo-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsProcessing(false);
          }, 'image/jpeg', 0.9);
        };
        
        // Try to load the PNG logo
        logoImg.src = '/logo/logo.png';
      };
      
      img.src = photoDataUrl;
      
    } catch (error) {
      console.error('Error processing photo:', error);
      setIsProcessing(false);
    }
  };

  const drawCommunityLogo = (ctx, x, y, width, height) => {
    // Save context state
    ctx.save();
    
    // Draw text logo (synchronous, always works)
    drawTextLogo(ctx, x, y);
    
    // Restore context state
    ctx.restore();
  };

  const drawTextLogo = (ctx, x, y) => {
    // Draw text without background
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // "It Takes a" text
    ctx.fillStyle = '#0c8596';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('It Takes a', x, y - 8);
    
    // "Community" text (larger, magenta)
    ctx.fillStyle = '#a3216e';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('Community', x, y + 2);
    
    // "to drive Change" text
    ctx.fillStyle = '#0c8596';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('to drive Change', x, y + 12);
  };

  return (
    <div className="space-y-6">
      {/* Preview with frame */}
      <div className="gradient-frame">
        <div className="gradient-frame-inner relative">
          {/* Community Logo - Overlay on the image */}
          <div className="community-logo">
            <img 
              src="/logo/logo.png" 
              alt="Community Logo"
              className="max-w-full max-h-full object-contain"
              style={{display: 'none'}}
              onLoad={() => {
                console.log('Preview logo loaded successfully');
                // Hide text and show image
                const textElement = document.querySelector('.community-logo-text');
                if (textElement) textElement.style.display = 'none';
                document.querySelector('.community-logo img').style.display = 'block';
              }}
              onError={(e) => {
                console.log('Preview logo failed to load:', e);
                // Keep text visible if logo fails to load
                e.target.style.display = 'none';
              }}
            />
            <div className="community-logo-text">
              <span className="sub-text">It Takes a</span>
              <span className="main-text">Community</span>
              <span className="sub-text">to drive Change</span>
            </div>
          </div>
          
          {/* Photo */}
          <img
            src={photoDataUrl}
            alt="Captured photo"
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRetake}
          className="px-6 py-3 bg-gray-500 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors duration-200"
        >
          Retake Photo
        </button>
        
        <button
          onClick={downloadPhoto}
          disabled={isProcessing}
          className="px-8 py-3 bg-gradient-to-r from-teal-primary to-magenta-primary text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Photo</span>
            </div>
          )}
        </button>
        
        <button
          onClick={onNewPhoto}
          className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors duration-200"
        >
          New Photo
        </button>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoPreview;

