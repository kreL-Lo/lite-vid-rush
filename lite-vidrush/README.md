# Lite VidRush 🎬

A lightweight, web-based video editor built with Next.js 14, TypeScript, TailwindCSS, and Remotion. Create videos by combining media clips, text overlays, and render them directly in the browser.

![Demo](./docs/demo.gif)

## 🚀 Features

### ✅ Core Implementation
- **Visual Timeline Editor**: Drag, trim, and arrange video/audio clips and text overlays
- **Real-time Preview**: Live preview using Remotion Player with frame-accurate scrubbing
- **Smart Timeline Management**: Automatic timeline extension
- **Multi-Track Support**: Separate tracks for video, audio, and text with unlimited expansion
- **Text Overlays**: Rich text styling with position, font, color, and opacity controls
- **Media Upload**: Drag & drop support for video (MP4, MOV, AVI), audio (MP3, WAV), and images (JPG, PNG)
- **Video Rendering**: Server-side MP4 export using Remotion with customizable quality settings
- **Responsive UI**: Modern dark theme with intuitive controls and keyboard shortcuts

### 🎛️ Advanced Features
- **Unlimited Track Expansion**: Clips can extend beyond timeline bounds with automatic adjustment
- **Audio Controls**: Master volume, per-clip volume, and mute functionality
- **Selection & Editing**: Click to select, drag to move, resize handles for trimming
- **Timeline Controls**: Play/pause, scrubbing, zoom in/out, timeline extension/shrinking

## 🏗️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: TailwindCSS with custom components
- **Video Processing**: Remotion for rendering and preview
- **State Management**: Zustand with Immer for immutable updates
- **Validation**: Zod schemas for API requests
- **Testing**: Vitest + Testing Library (107 tests, 94 passing)
- **File Handling**: Formidable for uploads, FFmpeg for media processing
- **UI Components**: Custom components with Radix UI primitives

## 📊 Data Model

### Core State Structure

```typescript
interface EditorState {
  media: Clip[];              // Video/audio/image clips
  texts: TextOverlay[];       // Text overlay elements
  selectedId: string | null;  // Currently selected item
  playhead: number;           // Current frame position
  frameRate: number;          // Timeline frame rate (default: 30fps)
  duration: number;           // Timeline duration in frames
  isPlaying: boolean;         // Playback state
  zoom: number;               // Timeline zoom level
  masterVolume: number;       // Global volume control
  muted: boolean;             // Global mute state
}
```

### Media Clip Model

```typescript
interface Clip {
  id: string;                 // Unique identifier
  src: string;                // File path/URL
  startFrame: number;         // Timeline start position
  endFrame: number;           // Timeline end position
  order: number;              // Z-index for overlapping clips
  type: 'video' | 'audio' | 'image';
  // Visual properties
  position?: { x: number; y: number };  // % from top-left
  scale?: { width: number; height: number }; // Scale factors
  rotation?: number;          // Rotation in degrees
  // Audio properties
  volume?: number;            // 0.0 to 1.0
  muted?: boolean;            // Individual mute state
}
```

### Text Overlay Model

```typescript
interface TextOverlay {
  id: string;
  text: string;               // Display text
  startFrame: number;         // Timeline start position
  endFrame: number;           // Timeline end position
  position: { x: number; y: number }; // % from top-left
  style: {
    fontSize: number;         // Font size in px
    fontFamily: string;       // Font family name
    color: string;            // Hex color
    opacity: number;          // 0.0 to 1.0
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right';
  };
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- 4GB+ RAM (for video rendering)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd lite-vidrush
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run type-check   # Check TypeScript types

# Testing
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
```

## 📁 Project Structure

```
lite-vidrush/
├── app/                     # Next.js App Router
│   ├── editor/             # Main editor page
│   │   └── page.tsx        # Editor UI component
│   ├── api/                # API routes
│   │   ├── render/         # POST /api/render - Video rendering
│   │   │   └── route.ts
│   │   └── media/          # POST /api/media - File upload
│   │       └── route.ts
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── __tests__/         # Component tests
│   ├── ui/                # Base UI components
│   ├── Timeline.tsx       # Main timeline component
│   ├── ClipItem.tsx       # Individual clip rendering
│   ├── Inspector.tsx      # Properties panel
│   ├── Preview.tsx        # Video preview window
│   ├── PlayControls.tsx   # Playback controls
│   └── MediaBrowser.tsx   # File browser & upload
├── lib/                   # Core logic & utilities
│   ├── __tests__/        # Unit & integration tests
│   ├── store.ts          # Zustand state management
│   ├── types.ts          # TypeScript type definitions
│   ├── timelineOps.ts    # Timeline operation functions
│   └── utils.ts          # Helper utilities
├── remotion/             # Remotion composition
│   ├── RootComposition.tsx  # Main composition
│   └── index.tsx         # Remotion config
└── public/uploads/       # Uploaded media files
```

## 🎯 Usage

### Basic Workflow

1. **Import Media**: 
   - Click "Import Media" or drag & drop files
   - Supports video (MP4, MOV, AVI), audio (MP3, WAV), images (JPG, PNG)
   - Files are automatically added to timeline

2. **Edit Timeline**:
   - **Select**: Click clips or text to select
   - **Move**: Drag clips to reposition
   - **Trim**: Drag clip edges to adjust duration
   - **Extend**: Timeline automatically grows as needed

3. **Add Text Overlays**:
   - Click "Add Text" to create text overlays
   - Edit text, position, and styling in Inspector panel
   - Drag to reposition, resize handles to adjust duration

4. **Preview & Playback**:
   - Use play/pause controls or spacebar
   - Scrub timeline by clicking or dragging playhead
   - Zoom in/out for detailed editing

5. **Export Video**:
   - Click "Export" to render MP4
   - Choose quality settings (720p, 1080p)
   - Download rendered video

### Advanced Features

#### Timeline Navigation
- **Zoom Controls**: Mouse wheel or +/- buttons
- **Fit to Content**: Auto-zoom to show all content
- **Scroll to Playhead**: Center view on current position
- **Keyboard Shortcuts**:
  - `Space`: Play/Pause
  - `Home`: Jump to start
  - `End`: Jump to end
  - `Ctrl+F`: Zoom to fit content
  - `Ctrl+G`: Go to playhead

#### Smart Timeline Management
- **Auto-Extension**: Timeline grows when content extends beyond bounds
- **Content Protection**: Timeline cannot shrink below content length
- **Visual Indicators**: Yellow line shows content end, gray area shows empty space

## 🔧 API Endpoints

### POST /api/media
Upload media files to the editor.

**Request**: FormData with `file` field
**Response**: 
```json
{
  "success": true,
  "file": {
    "id": "unique-id",
    "name": "video.mp4",
    "src": "/uploads/video.mp4",
    "size": 1024000,
    "type": "video",
    "duration": 10.5
  }
}
```

### POST /api/render
Render editor state to MP4 video.

**Request**:
```json
{
  "editorState": {
    "media": [...],
    "texts": [...],
    "duration": 300,
    "frameRate": 30
  },
  "settings": {
    "width": 1280,
    "height": 720,
    "fps": 30,
    "codec": "h264"
  }
}
```

**Response**: MP4 video file (binary stream)

## 🧪 Testing

The project includes comprehensive test coverage:

- **107 total tests** across multiple test suites
- **Unit Tests**: Timeline operations, utility functions, store actions
- **Component Tests**: React component rendering and interactions
- **Integration Tests**: Complete user workflows and edge cases

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:run -- --coverage

# Run specific test file
npm test -- timelineOps.test.ts
```

## 🎯 Key Design Decisions

### 1. **Frame-Based Timeline**
- All positions stored as frame numbers for precision
- Consistent 30fps default with configurable frame rates
- Frame-accurate scrubbing and positioning

### 2. **Immutable State Management**
- Zustand + Immer for predictable state updates
- Pure functions for timeline operations
- Automatic timeline duration management

### 3. **Smart Timeline Behavior**
- Auto-extension when content grows
- Manual shrinking only (prevents accidental content loss)
- Visual feedback for content boundaries

### 4. **Component Architecture**
- Separation of concerns: UI components vs. logic functions
- Reusable components with clear prop interfaces
- Custom hooks for state management

### 5. **Server-Side Rendering**
- Synchronous rendering for simplicity
- Remotion handles video composition
- Deterministic output for identical inputs

## ⚠️ Current Limitations

### Technical Constraints
- **File Size**: 100MB upload limit per file
- **Duration**: Optimized for videos under 30 seconds
- **Formats**: Limited to common web formats (MP4, WAV, JPG, PNG)
- **Performance**: Large files may cause browser slowdown

### Missing Features
- **Drag & Drop Reordering**: Clips can be moved but not reordered by dragging
- **Audio Waveforms**: No visual waveform display
- **Video Thumbnails**: No thumbnail previews in timeline
- **Transitions**: No fade/dissolve effects between clips
- **Undo/Redo**: No action history management
- **Project Save/Load**: No persistent project storage
- **Multi-Track**: Single video track (overlays supported via positioning)
- **Advanced Positioning**: No pixel-perfect drag-and-drop positioning for text overlays within the video canvas
- **Layer Management**: No z-index/depth controls for overlapping elements
- **Snap-to-Grid**: No alignment guides or snap-to-grid functionality for precise positioning
- **Text Animation**: No keyframe-based text movement or animation effects
- **Automatic Track Positioning**: No intelligent track arrangement or collision detection
- **Track Grouping**: No ability to group related clips/overlays for batch operations
- **Magnetic Timeline**: No automatic snapping between adjacent clips or timeline markers

### Known Issues
- **Large Timeline Performance**: Very long timelines (1000+ seconds) may impact performance
- **Memory Usage**: Multiple large video files can consume significant RAM
- **Browser Compatibility**: Optimized for modern browsers (Chrome, Firefox, Safari)

## 🤖 AI Usage Log

This project was developed with extensive AI assistance. Here's a summary of AI tool usage:

### Major AI Contributions:
1. **Initial Project Setup**: Generated complete Next.js 14 scaffolding with TypeScript, TailwindCSS, and all required dependencies
2. **Component Architecture**: Created modular component structure with Timeline, ClipItem, Inspector, and Preview components
3. **State Management**: Implemented Zustand store with Immer middleware for immutable updates
4. **Timeline Logic**: Developed complex timeline operations (add, remove, trim, reorder) with frame-based positioning
5. **Remotion Integration**: Set up video rendering pipeline with server-side MP4 export
6. **Testing Suite**: Generated comprehensive test coverage (107 tests) including unit, component, and integration tests
7. **Smart Timeline Features**: Implemented auto-extension, zoom controls, and viewport management
8. **UI/UX Improvements**: Added visual indicators, keyboard shortcuts, and responsive design

### AI Tools Used:
- **Claude Sonnet**: Primary development assistance
- **GitHub Copilot**: Code completion and suggestions
- **Cursor**: IDE-integrated AI assistance

### Human Modifications:
- **Design Decisions**: Chose frame-based timeline over time-based for precision
- **UX Improvements**: Added smart timeline management and visual feedback
- **Performance Optimizations**: Implemented efficient re-rendering strategies
- **Error Handling**: Added comprehensive error boundaries and validation

## 🎬 Demo

### Editor Interface
![Editor Screenshot](./docs/editor-screenshot.png)

### Key Features Demo:
1. **Media Upload**: Drag & drop video/audio files
2. **Timeline Editing**: Trim, move, and arrange clips
3. **Text Overlays**: Add and style text elements
4. **Real-time Preview**: See changes instantly
5. **Video Export**: Render and  download MP4

*Note: Demo video/GIF will be added to showcase the complete workflow*

## 🚀 Future Enhancements

### Planned Features:
- **Advanced Transitions**: Fade, dissolve, slide effects
- **Audio Waveforms**: Visual audio editing
- **Video Thumbnails**: Timeline preview thumbnails
- **Multi-Track Support**: Multiple video/audio layers
- **Keyboard Shortcuts**: Complete keyboard navigation
- **Project Management**: Save/load project files
- **Cloud Storage**: Upload to cloud services
- **Real-time Collaboration**: Multi-user editing


