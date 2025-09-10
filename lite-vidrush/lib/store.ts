/**
 * Zustand store for editor state management
 * Uses immer for immutable updates
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  EditorState,
  Clip,
  TextOverlay,
  DEFAULT_EDITOR_STATE,
  DEFAULT_TEXT_STYLE,
} from './types';
import {
  addClip,
  addTextOverlay,
  removeItem,
  trimClip,
  trimTextOverlay,
  reorderClips,
  setPlayhead,
  togglePlayback,
  setZoom,
  selectItem,
  calculateTimelineDuration,
  autoAdjustTimelineDuration,
  fitTimelineToContent,
  getMinimumTimelineDuration,
  getOptimalTimelineDuration,
} from './timelineOps';

interface EditorStore extends EditorState {
  // Actions
  addClip: (clip: Omit<Clip, 'id' | 'order'>) => void;
  addTextOverlay: (text: Omit<TextOverlay, 'id'>) => void;
  removeItem: (id: string) => void;
  trimClip: (clipId: string, startFrame: number, endFrame: number) => void;
  trimTextOverlay: (textId: string, startFrame: number, endFrame: number) => void;
  reorderClips: (fromIndex: number, toIndex: number) => void;
  setPlayhead: (frame: number) => void;
  seekTo: (frame: number) => void;
  togglePlayback: () => void;
  setZoom: (zoom: number) => void;
  selectItem: (id: string | null) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  setDuration: (duration: number) => void;
  setFrameRate: (frameRate: number) => void;
  extendTimeline: (additionalSeconds: number) => void;
  shrinkTimeline: (secondsToRemove: number) => void;
  fitTimelineToContent: () => void;
  autoAdjustTimeline: () => void;
  setMasterVolume: (volume: number) => void;
  toggleMute: () => void;
  setClipVolume: (clipId: string, volume: number) => void;
  toggleClipMute: (clipId: string) => void;
  resetState: () => void;
  
  // Computed values
  getSelectedItem: () => Clip | TextOverlay | null;
  getTimelineDuration: () => number;
  
  // Playback control
  play: () => void;
  pause: () => void;
  stop: () => void;
}

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...DEFAULT_EDITOR_STATE,

      // Timeline operations
      addClip: (clip) => {
        set((state) => {
          let newState = addClip(state, clip);
          // Auto-adjust timeline duration to fit new content
          newState = autoAdjustTimelineDuration(newState);
          Object.assign(state, newState);
        });
      },

      addTextOverlay: (text) => {
        set((state) => {
          // Use default style merged with provided style
          const textWithDefaults = {
            ...text,
            style: { ...DEFAULT_TEXT_STYLE, ...text.style },
          };
          let newState = addTextOverlay(state, textWithDefaults);
          // Auto-adjust timeline duration to fit new content
          newState = autoAdjustTimelineDuration(newState);
          Object.assign(state, newState);
        });
      },

      removeItem: (id) => {
        set((state) => {
          const newState = removeItem(state, id);
          // Note: Don't auto-shrink timeline when removing items to avoid unexpected behavior
          // User can manually use "Fit to Content" if desired
          Object.assign(state, newState);
        });
      },

      trimClip: (clipId, startFrame, endFrame) => {
        set((state) => {
          let newState = trimClip(state, clipId, startFrame, endFrame);
          // Auto-extend timeline if clip was trimmed to extend beyond current duration
          const maxFrame = Math.max(startFrame, endFrame);
          if (maxFrame > state.duration) {
            newState = autoAdjustTimelineDuration(newState);
          }
          Object.assign(state, newState);
        });
      },

      trimTextOverlay: (textId, startFrame, endFrame) => {
        set((state) => {
          let newState = trimTextOverlay(state, textId, startFrame, endFrame);
          // Auto-extend timeline if text was trimmed to extend beyond current duration
          const maxFrame = Math.max(startFrame, endFrame);
          if (maxFrame > state.duration) {
            newState = autoAdjustTimelineDuration(newState);
          }
          Object.assign(state, newState);
        });
      },

      reorderClips: (fromIndex, toIndex) => {
        set((state) => {
          const newState = reorderClips(state, fromIndex, toIndex);
          Object.assign(state, newState);
        });
      },

      setPlayhead: (frame) => {
        set((state) => {
          state.playhead = Math.max(0, Math.min(frame, state.duration));
          // Don't stop playback when setting playhead programmatically
        });
      },

      // Manual seek (stops playback)
      seekTo: (frame: number) => {
        set((state) => {
          state.playhead = Math.max(0, Math.min(frame, state.duration));
          state.isPlaying = false; // Stop playback when manually seeking
        });
      },

      togglePlayback: () => {
        set((state) => {
          const newState = togglePlayback(state);
          Object.assign(state, newState);
        });
      },

      setZoom: (zoom) => {
        set((state) => {
          const newState = setZoom(state, zoom);
          Object.assign(state, newState);
        });
      },

      selectItem: (id) => {
        set((state) => {
          const newState = selectItem(state, id);
          Object.assign(state, newState);
        });
      },

      updateClip: (id, updates) => {
        set((state) => {
          state.media = state.media.map((clip) =>
            clip.id === id ? { ...clip, ...updates } : clip
          );
          // Auto-adjust timeline if clip was moved/extended beyond current duration
          if (updates.endFrame && updates.endFrame > state.duration) {
            const newState = autoAdjustTimelineDuration(state);
            Object.assign(state, newState);
          }
        });
      },

      updateTextOverlay: (id, updates) => {
        set((state) => {
          state.texts = state.texts.map((text) =>
            text.id === id ? { ...text, ...updates } : text
          );
          // Auto-adjust timeline if text was moved/extended beyond current duration
          if (updates.endFrame && updates.endFrame > state.duration) {
            const newState = autoAdjustTimelineDuration(state);
            Object.assign(state, newState);
          }
        });
      },

      setDuration: (duration) => {
        set((state) => {
          state.duration = Math.max(0, duration);
        });
      },

      setFrameRate: (frameRate) => {
        set((state) => {
          state.frameRate = Math.max(1, frameRate);
        });
      },

      extendTimeline: (additionalSeconds) => {
        set((state) => {
          const additionalFrames = additionalSeconds * state.frameRate;
          state.duration = state.duration + additionalFrames;
        });
      },

      shrinkTimeline: (secondsToRemove) => {
        set((state) => {
          const framesToRemove = secondsToRemove * state.frameRate;
          const minDuration = getMinimumTimelineDuration(state);
          const newDuration = Math.max(state.duration - framesToRemove, minDuration);
          state.duration = newDuration;
        });
      },

      fitTimelineToContent: () => {
        set((state) => {
          const newState = fitTimelineToContent(state);
          Object.assign(state, newState);
        });
      },

      autoAdjustTimeline: () => {
        set((state) => {
          const newState = autoAdjustTimelineDuration(state);
          Object.assign(state, newState);
        });
      },

      setMasterVolume: (volume) => {
        set((state) => {
          state.masterVolume = Math.max(0, Math.min(1, volume));
        });
      },

      toggleMute: () => {
        set((state) => {
          state.muted = !state.muted;
        });
      },

      setClipVolume: (clipId, volume) => {
        set((state) => {
          const clip = state.media.find(c => c.id === clipId);
          if (clip) {
            clip.volume = Math.max(0, Math.min(1, volume));
          }
        });
      },

      toggleClipMute: (clipId) => {
        set((state) => {
          const clip = state.media.find(c => c.id === clipId);
          if (clip) {
            clip.muted = !clip.muted;
          }
        });
      },

      resetState: () => {
        set(() => ({ ...DEFAULT_EDITOR_STATE }));
      },

      // Computed values
      getSelectedItem: () => {
        const state = get();
        if (!state.selectedId) return null;
        
        const clip = state.media.find((c) => c.id === state.selectedId);
        if (clip) return clip;
        
        const text = state.texts.find((t) => t.id === state.selectedId);
        return text || null;
      },

      getTimelineDuration: () => {
        return calculateTimelineDuration(get());
      },

      // Playback controls
      play: () => {
        set((state) => {
          state.isPlaying = true;
        });
      },

      pause: () => {
        set((state) => {
          state.isPlaying = false;
        });
      },

      stop: () => {
        set((state) => {
          state.isPlaying = false;
          state.playhead = 0;
        });
      },
    }))
  )
);

// Selector hooks for optimized re-renders
export const usePlayhead = () => useEditorStore((state) => state.playhead);
export const useIsPlaying = () => useEditorStore((state) => state.isPlaying);
export const useSelectedItem = () => useEditorStore((state) => state.getSelectedItem());
export const useMediaClips = () => useEditorStore((state) => state.media);
export const useTextOverlays = () => useEditorStore((state) => state.texts);
export const useTimelineZoom = () => useEditorStore((state) => state.zoom);
export const useFrameRate = () => useEditorStore((state) => state.frameRate);
export const useDuration = () => useEditorStore((state) => state.duration);

// Playback timing is now handled by the Remotion Player in Preview component
// This prevents conflicts between our custom animation loop and Remotion's internal timing
// The Preview component listens to Remotion Player's frame updates and syncs back to the store

// Simple cleanup for when playback stops
useEditorStore.subscribe(
  (state) => state.isPlaying,
  (isPlaying) => {
    if (!isPlaying) {
      // Just handle stop-at-end logic
      const state = useEditorStore.getState();
      if (state.playhead >= state.duration) {
        useEditorStore.getState().pause();
      }
    }
  }
);

// TODO: Add persistence middleware to save state to localStorage
// TODO: Add undo/redo functionality
// TODO: Add keyboard shortcuts
// TODO: Add project save/load functionality
