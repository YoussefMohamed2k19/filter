# Web Filter - Marketing Campaign App

A React application with Tailwind CSS for capturing selfies with a frame overlay for marketing campaigns.

## Features

- 📸 Open camera and capture selfies
- 🖼️ Automatic frame overlay on captured images
- 📥 Download images in 1080x1920px resolution
- 🎨 Smooth and professional UX with animations
- 📱 Responsive design

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

### Preview Production Build

Preview the production build:
```bash
npm run preview
```

## Usage

1. Click "Open Camera" to start the camera
2. Position yourself in the frame
3. Click the capture button to take a selfie
4. Review your image with the frame overlay
5. Click "Download" to save the 1080x1920px image
6. Click "Retake" if you want to capture another photo

## Technical Details

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Output Resolution**: 1080x1920px (9:16 aspect ratio)
- **Image Format**: PNG

## Browser Requirements

- Modern browser with camera access support
- HTTPS or localhost (required for camera access)

