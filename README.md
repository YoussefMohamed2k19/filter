# Web Filter Camera

A React-based camera application that captures photos and adds beautiful gradient frames with community branding.

## Features

- 📸 **Camera Integration**: Access device camera with mobile-optimized interface
- 🎨 **Gradient Frames**: Beautiful linear gradient frames (#0c8596 to #a3216e)
- 🏷️ **Community Logo**: "It Takes a Community to drive Change" logo overlay
- 📱 **Mobile-First**: Fully responsive design optimized for mobile devices
- 💾 **Download**: Save photos with frames and logo applied
- 🎯 **Modern UI**: Clean, intuitive interface built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Yarn package manager
- Modern web browser with camera support

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Start the development server:
```bash
yarn start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
yarn build
```

## Usage

1. **Start Camera**: Click "Start Camera" to access your device's camera
2. **Capture Photo**: Use the "Capture" button to take a photo
3. **Preview**: See your photo with the gradient frame and community logo
4. **Download**: Click "Download Photo" to save the framed image
5. **Options**: Use "Retake Photo" or "New Photo" for additional captures

## Technical Details

- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Camera API**: MediaDevices.getUserMedia()
- **Image Processing**: HTML5 Canvas
- **Mobile Support**: Responsive design with touch-friendly controls

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari (iOS 11+)
- Edge

## Camera Permissions

The app requires camera access. Make sure to:
- Allow camera permissions when prompted
- Use HTTPS in production (required for camera access)
- Test on actual mobile devices for best experience

## Adding Your Logo

To add your own PNG logo:

1. **Place your logo file** in `/public/logo/` directory
2. **Name it** `community-logo.png`
3. **Recommended specs**:
   - Format: PNG (with transparent background preferred)
   - Size: 200x80 pixels or similar aspect ratio
   - High resolution for crisp display

The app will automatically:
- Use your PNG logo in both preview and downloaded photos
- Fall back to SVG if PNG is not available
- Fall back to text logo if neither image is found

## Customization

You can customize the gradient colors and logo by modifying:
- `tailwind.config.js` for gradient colors
- `src/components/PhotoPreview.js` for logo handling
- `src/index.css` for logo styling
- Replace `/public/logo/community-logo.png` with your own logo

## License

MIT License - feel free to use this project for your own purposes.

