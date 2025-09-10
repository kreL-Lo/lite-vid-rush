/**
 * Pure functions for timeline operations
 * These functions handle clip manipulation, reordering, and timeline calculations
 */

import { Clip, TextOverlay, EditorState, TimelineItem } from './types';

/**
 * Add a new clip to the timeline
 */
export function addClip(state: EditorState, clip: Omit<Clip, 'id' | 'order'>): EditorState {
  const newClip: Clip = {
    ...clip,
    id: generateId(),
    order: state.media.length,
  };

  return {
    ...state,
    media: [...state.media, newClip],
    selectedId: newClip.id,
  };
}

/**
 * Add a new text overlay to the timeline
 */
export function addTextOverlay(state: EditorState, text: Omit<TextOverlay, 'id'>): EditorState {
  const newText: TextOverlay = {
    ...text,
    id: generateId(),
  };

  return {
    ...state,
    texts: [...state.texts, newText],
    selectedId: newText.id,
  };
}

/**
 * Remove a clip or text overlay by ID
 */
export function removeItem(state: EditorState, id: string): EditorState {
  const newState = {
    ...state,
    media: state.media.filter(clip => clip.id !== id),
    texts: state.texts.filter(text => text.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
  };

  // Reorder remaining clips
  newState.media = newState.media.map((clip, index) => ({
    ...clip,
    order: index,
  }));

  return newState;
}

/**
 * Trim a clip's duration
 */
export function trimClip(
  state: EditorState,
  clipId: string,
  newStartFrame: number,
  newEndFrame: number
): EditorState {
  return {
    ...state,
    media: state.media.map(clip =>
      clip.id === clipId
        ? {
            ...clip,
            startFrame: Math.max(0, newStartFrame),
            endFrame: Math.max(newStartFrame + 1, newEndFrame),
          }
        : clip
    ),
  };
}

/**
 * Trim a text overlay's duration
 */
export function trimTextOverlay(
  state: EditorState,
  textId: string,
  newStartFrame: number,
  newEndFrame: number
): EditorState {
  return {
    ...state,
    texts: state.texts.map(text =>
      text.id === textId
        ? {
            ...text,
            startFrame: Math.max(0, newStartFrame),
            endFrame: Math.max(newStartFrame + 1, newEndFrame),
          }
        : text
    ),
  };
}

/**
 * Reorder clips in the timeline
 */
export function reorderClips(state: EditorState, fromIndex: number, toIndex: number): EditorState {
  const newMedia = [...state.media];
  const [movedClip] = newMedia.splice(fromIndex, 1);
  newMedia.splice(toIndex, 0, movedClip);

  // Update order property
  const reorderedMedia = newMedia.map((clip, index) => ({
    ...clip,
    order: index,
  }));

  return {
    ...state,
    media: reorderedMedia,
  };
}

/**
 * Move playhead to specific frame
 */
export function setPlayhead(state: EditorState, frame: number): EditorState {
  return {
    ...state,
    playhead: Math.max(0, Math.min(frame, state.duration)),
    isPlaying: false, // Stop playback when manually seeking
  };
}

/**
 * Toggle playback state
 */
export function togglePlayback(state: EditorState): EditorState {
  return {
    ...state,
    isPlaying: !state.isPlaying,
  };
}

/**
 * Update timeline zoom level
 */
export function setZoom(state: EditorState, zoom: number): EditorState {
  return {
    ...state,
    zoom: Math.max(0.1, Math.min(zoom, 10)), // Clamp between 0.1x and 10x
  };
}

/**
 * Select an item (clip or text overlay)
 */
export function selectItem(state: EditorState, id: string | null): EditorState {
  return {
    ...state,
    selectedId: id,
  };
}

/**
 * Get all timeline items (clips and text overlays) sorted by start time
 */
export function getTimelineItems(state: EditorState): TimelineItem[] {
  const clipItems: TimelineItem[] = state.media.map(clip => ({
    id: clip.id,
    type: 'clip' as const,
    startFrame: clip.startFrame,
    endFrame: clip.endFrame,
    order: clip.order,
    data: clip,
  }));

  const textItems: TimelineItem[] = state.texts.map(text => ({
    id: text.id,
    type: 'text' as const,
    startFrame: text.startFrame,
    endFrame: text.endFrame,
    order: 0, // Text overlays don't have order
    data: text,
  }));

  return [...clipItems, ...textItems].sort((a, b) => a.startFrame - b.startFrame);
}

/**
 * Get items visible at a specific frame
 */
export function getItemsAtFrame(state: EditorState, frame: number): TimelineItem[] {
  return getTimelineItems(state).filter(
    item => frame >= item.startFrame && frame < item.endFrame
  );
}

/**
 * Calculate total timeline duration based on clips
 */
export function calculateTimelineDuration(state: EditorState): number {
  const maxEndFrame = Math.max(
    ...state.media.map(clip => clip.endFrame),
    ...state.texts.map(text => text.endFrame),
    0
  );
  return maxEndFrame;
}

/**
 * Calculate the minimum required timeline duration (last item end frame)
 */
export function getMinimumTimelineDuration(state: EditorState): number {
  return calculateTimelineDuration(state);
}

/**
 * Calculate optimal timeline duration with buffer
 */
export function getOptimalTimelineDuration(state: EditorState, bufferSeconds: number = 2): number {
  const minDuration = getMinimumTimelineDuration(state);
  const bufferFrames = bufferSeconds * state.frameRate;
  return Math.max(minDuration + bufferFrames, state.frameRate * 10); // Minimum 10 seconds
}

/**
 * Auto-adjust timeline duration to fit content
 */
export function autoAdjustTimelineDuration(state: EditorState): EditorState {
  const optimalDuration = getOptimalTimelineDuration(state);
  return {
    ...state,
    duration: Math.max(optimalDuration, state.duration), // Never shrink automatically
  };
}

/**
 * Fit timeline duration exactly to content (no buffer)
 */
export function fitTimelineToContent(state: EditorState): EditorState {
  const minDuration = Math.max(
    getMinimumTimelineDuration(state),
    state.frameRate * 5 // Minimum 5 seconds
  );
  return {
    ...state,
    duration: minDuration,
  };
}

/**
 * Convert frames to time string (MM:SS)
 */
export function framesToTime(frames: number, frameRate: number): string {
  const totalSeconds = frames / frameRate;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Convert time string (MM:SS) to frames
 */
export function timeToFrames(timeString: string, frameRate: number): number {
  const [minutes, seconds] = timeString.split(':').map(Number);
  return (minutes * 60 + seconds) * frameRate;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validate that timeline state is consistent
 */
export function validateTimelineState(state: EditorState): string[] {
  const errors: string[] = [];

  // Check for overlapping clips in the same track
  const sortedClips = [...state.media].sort((a, b) => a.startFrame - b.startFrame);
  for (let i = 0; i < sortedClips.length - 1; i++) {
    const current = sortedClips[i];
    const next = sortedClips[i + 1];
    if (current.endFrame > next.startFrame) {
      errors.push(`Clip ${current.id} overlaps with clip ${next.id}`);
    }
  }

  // Check for invalid frame ranges
  [...state.media, ...state.texts].forEach(item => {
    if (item.startFrame >= item.endFrame) {
      errors.push(`Item ${item.id} has invalid frame range: ${item.startFrame}-${item.endFrame}`);
    }
    if (item.startFrame < 0) {
      errors.push(`Item ${item.id} has negative start frame: ${item.startFrame}`);
    }
  });

  return errors;
}

// TODO: Implement these advanced features
// - Snap to grid functionality
// - Ripple edit (moving clips affects subsequent clips)
// - Slip edit (changing clip content without changing duration)
// - Slide edit (moving clip without changing duration)
// - Multi-track support
// - Keyframe animation support
