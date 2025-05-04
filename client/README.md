# Face Recognition App - Client

This is the client application for the Face Recognition system, built with React, TypeScript, and Tailwind CSS.

## Overview

The Face Recognition App provides a modern UI for facial recognition tasks including:

- User registration with facial images
- Face recognition and verification
- User management
- Multilingual support (English and Arabic)

## Technical Stack

- **React 19** - Frontend library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **i18next** - Internationalization
- **Vite** - Build tool

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── auth/            # Authentication components and services
│   ├── components/      # Reusable UI components
│   │   ├── RecognizeFace/  # Face recognition components (modular)
│   │   ├── RegisterFace.tsx # Face registration component
│   │   └── ...
│   ├── services/        # API services
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   ├── index.css        # Global CSS including Tailwind imports
│   └── main.tsx         # Application entry point
├── tailwind.config.js   # Tailwind CSS configuration
└── package.json         # Project dependencies
```

## UI Components

The application uses a component-based architecture with these key UI elements:

- **RecognizeFace** - Core component for face recognition, split into:

  - ImageCapture - Handles webcam/file input
  - UserInfoCard - Displays recognized user data
  - FaceAnalysisDisplay - Shows face analysis metrics
  - ErrorDisplay - Presents recognition errors
  - ApiStatus - Shows API connection status

- **Layout Components**:
  - MainLayout - Standard application layout with navigation
  - AuthLayout - Special layout for authentication screens

## Tailwind CSS Implementation

The project uses Tailwind CSS for styling with:

- Custom component classes in `index.css`
- Responsive design patterns
- Dark/light mode support
- RTL language support
- Custom color schemes

### Custom Utilities

```css
/* Example of custom utilities in index.css */
@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700 transition;
  }

  .form-input {
    @apply px-3 py-2 block w-full border border-gray-300 rounded-md 
      focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Accessibility

The application follows WCAG guidelines with:

- Proper semantic HTML
- Keyboard navigation
- Screen reader support
- Color contrast compliance

## Performance Optimization

- Image compression before upload/processing
- Lazy loading of components
- WebGL hardware acceleration when available
- Progressive loading for large files

## Backend Integration

This client connects to a FastAPI backend service that provides:

- Face detection and recognition
- User data management
- Authentication services
