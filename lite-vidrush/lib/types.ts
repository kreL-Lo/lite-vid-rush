/**
 * Core data models for the video editor
 */

export interface Clip {
  id: string;
  src: string; // URL or path to the media file
  startFrame: number; // Start frame in the timeline
  endFrame: number; // End frame in the timeline
  order: number; // Display order in the timeline
  type: 'video' | 'audio' | 'image';
  // Visual properties
  position?: {
    x: number; // Percentage from left (0-100)
    y: number; // Percentage from top (0-100)
  };
  scale?: {
    width: number; // Scale factor (1.0 = original size)
    height: number; // Scale factor (1.0 = original size)
  };
  rotation?: number; // Rotation in degrees
  // Audio properties
  volume?: number; // Volume level (0.0 to 1.0, default 1.0)
  muted?: boolean; // Whether the clip is muted
  // TODO: Add support for trim in/out points
  trimStart?: number; // Trim start in source media frames
  trimEnd?: number; // Trim end in source media frames
}

export interface TextOverlay {
  id: string;
  text: string;
  startFrame: number;
  endFrame: number;
  position: {
    x: number; // Percentage from left (0-100)
    y: number; // Percentage from top (0-100)
  };
  scale?: {
    width: number; // Scale factor (1.0 = original size)
    height: number; // Scale factor (1.0 = original size)
  };
  rotation?: number; // Rotation in degrees
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    opacity: number;
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right';
  };
}

export interface EditorState {
  media: Clip[];
  texts: TextOverlay[];
  selectedId: string | null; // Currently selected clip or text overlay
  playhead: number; // Current playhead position in frames
  // Timeline configuration
  frameRate: number; // Default 30fps
  duration: number; // Total timeline duration in frames
  // Playback state
  isPlaying: boolean;
  // Audio settings
  masterVolume: number; // Master volume (0.0 to 1.0, default 1.0)
  muted: boolean; // Master mute
  // View settings
  zoom: number; // Timeline zoom level (1.0 = default)
  scrollPosition: number; // Timeline scroll position
}

export interface RenderSettings {
  width: number;
  height: number;
  fps: number;
  codec: 'h264' | 'h265';
  bitrate?: string;
  outputFormat: 'mp4' | 'webm';
}

export interface TimelineItem {
  id: string;
  type: 'clip' | 'text';
  startFrame: number;
  endFrame: number;
  order: number;
  data: Clip | TextOverlay;
}

// API Types
export interface RenderRequest {
  editorState: EditorState;
  settings?: Partial<RenderSettings>;
}

export interface RenderResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
  renderTime?: number;
}

export interface MediaUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  metadata?: {
    duration?: number;
    width?: number;
    height?: number;
    size: number;
  };
}

// Default values
export const DEFAULT_EDITOR_STATE: EditorState = {
  media: [],
  texts: [],
  selectedId: null,
  playhead: 0,
  frameRate: 30,
  duration: 900, // 30 seconds at 30fps
  isPlaying: false,
  masterVolume: 1.0,
  muted: false,
  zoom: 1.0,
  scrollPosition: 0,
};

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  width: 1280,
  height: 720,
  fps: 30,
  codec: 'h264',
  outputFormat: 'mp4',
};

export const DEFAULT_TEXT_STYLE = {
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  color: '#ffffff',
  opacity: 1,
  fontWeight: 'normal' as const,
  textAlign: 'center' as const,
};
