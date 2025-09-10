/**
 * Unit tests for Zustand store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from '../store';
import { DEFAULT_EDITOR_STATE } from '../types';

// Mock the animation frame for playback testing
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('Editor Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useEditorStore());
    act(() => {
      result.current.resetState();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useEditorStore());
      
      expect(result.current.media).toHaveLength(0);
      expect(result.current.texts).toHaveLength(0);
      expect(result.current.selectedId).toBeNull();
      expect(result.current.playhead).toBe(0);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.frameRate).toBe(30);
      expect(result.current.zoom).toBe(1);
      expect(result.current.masterVolume).toBe(1);
      expect(result.current.muted).toBe(false);
    });
  });

  describe('Clip Operations', () => {
    it('should add clip and auto-adjust timeline', () => {
      const { result } = renderHook(() => useEditorStore());
      
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 150,
          type: 'video',
        });
      });

      expect(result.current.media).toHaveLength(1);
      expect(result.current.media[0].src).toBe('test.mp4');
      expect(result.current.media[0].endFrame).toBe(150);
      expect(result.current.duration).toBeGreaterThan(150); // Auto-adjusted
      expect(result.current.selectedId).toBe(result.current.media[0].id);
    });

    it('should update clip and extend timeline if needed', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add a clip first
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
      });

      const clipId = result.current.media[0].id;
      const initialDuration = result.current.duration;

      // Update clip to extend beyond current timeline
      act(() => {
        result.current.updateClip(clipId, { endFrame: 500 });
      });

      expect(result.current.media[0].endFrame).toBe(500);
      expect(result.current.duration).toBeGreaterThanOrEqual(initialDuration);
    });

    it('should remove clip without auto-shrinking timeline', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add a clip
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 150,
          type: 'video',
        });
      });

      const clipId = result.current.media[0].id;
      const timelineDuration = result.current.duration;

      // Remove the clip
      act(() => {
        result.current.removeItem(clipId);
      });

      expect(result.current.media).toHaveLength(0);
      expect(result.current.duration).toBe(timelineDuration); // Should not shrink
      expect(result.current.selectedId).toBeNull();
    });

    it('should trim clip and extend timeline if needed', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add a clip
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
      });

      const clipId = result.current.media[0].id;
      const initialDuration = result.current.duration;

      // Trim clip to extend beyond timeline
      act(() => {
        result.current.trimClip(clipId, 0, 600);
      });

      expect(result.current.media[0].endFrame).toBe(600);
      expect(result.current.duration).toBeGreaterThanOrEqual(initialDuration);
    });
  });

  describe('Text Overlay Operations', () => {
    it('should add text overlay and auto-adjust timeline', () => {
      const { result } = renderHook(() => useEditorStore());
      
      act(() => {
        result.current.addTextOverlay({
          text: 'Hello World',
          startFrame: 50,
          endFrame: 200,
          position: { x: 50, y: 50 },
          style: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#ffffff',
            opacity: 1,
            fontWeight: 'normal',
            textAlign: 'center',
          },
        });
      });

      expect(result.current.texts).toHaveLength(1);
      expect(result.current.texts[0].text).toBe('Hello World');
      expect(result.current.duration).toBeGreaterThan(200); // Auto-adjusted
      expect(result.current.selectedId).toBe(result.current.texts[0].id);
    });

    it('should update text overlay and extend timeline if needed', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add text first
      act(() => {
        result.current.addTextOverlay({
          text: 'Hello',
          startFrame: 0,
          endFrame: 100,
          position: { x: 50, y: 50 },
          style: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#ffffff',
            opacity: 1,
            fontWeight: 'normal',
            textAlign: 'center',
          },
        });
      });

      const textId = result.current.texts[0].id;
      const initialDuration = result.current.duration;

      // Update text to extend beyond timeline
      act(() => {
        result.current.updateTextOverlay(textId, { endFrame: 400 });
      });

      expect(result.current.texts[0].endFrame).toBe(400);
      expect(result.current.duration).toBeGreaterThanOrEqual(initialDuration);
    });
  });

  describe('Playback Controls', () => {
    it('should play and pause', () => {
      const { result } = renderHook(() => useEditorStore());
      
      act(() => {
        result.current.play();
      });
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.pause();
      });
      expect(result.current.isPlaying).toBe(false);
    });

    it('should stop and reset playhead', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Set playhead to some position
      act(() => {
        result.current.setPlayhead(100);
      });
      expect(result.current.playhead).toBe(100);

      // Stop should reset to 0
      act(() => {
        result.current.stop();
      });
      expect(result.current.playhead).toBe(0);
      expect(result.current.isPlaying).toBe(false);
    });

    it('should toggle playback', () => {
      const { result } = renderHook(() => useEditorStore());
      
      expect(result.current.isPlaying).toBe(false);
      
      act(() => {
        result.current.togglePlayback();
      });
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlayback();
      });
      expect(result.current.isPlaying).toBe(false);
    });

    it('should set playhead within bounds', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Set duration first
      act(() => {
        result.current.setDuration(300);
      });

      // Set playhead within bounds
      act(() => {
        result.current.setPlayhead(150);
      });
      expect(result.current.playhead).toBe(150);

      // Try to set beyond duration
      act(() => {
        result.current.setPlayhead(500);
      });
      expect(result.current.playhead).toBe(300); // Clamped to duration

      // Try to set negative
      act(() => {
        result.current.setPlayhead(-50);
      });
      expect(result.current.playhead).toBe(0); // Clamped to 0
    });

    it('should seek and stop playback', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Start playing
      act(() => {
        result.current.play();
      });
      expect(result.current.isPlaying).toBe(true);

      // Seek should stop playback
      act(() => {
        result.current.seekTo(100);
      });
      expect(result.current.playhead).toBe(100);
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Timeline Management', () => {
    it('should extend timeline', () => {
      const { result } = renderHook(() => useEditorStore());
      
      const initialDuration = result.current.duration;
      
      act(() => {
        result.current.extendTimeline(5); // 5 seconds
      });

      expect(result.current.duration).toBe(initialDuration + (5 * 30)); // 30fps
    });

    it('should shrink timeline with content protection', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add content first
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 200,
          type: 'video',
        });
      });

      const contentEndFrame = result.current.media[0].endFrame;
      
      // Try to shrink timeline
      act(() => {
        result.current.shrinkTimeline(10); // 10 seconds
      });

      // Should not shrink below content
      expect(result.current.duration).toBeGreaterThanOrEqual(contentEndFrame);
    });

    it('should fit timeline to content', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add content
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
      });

      // Fit timeline
      act(() => {
        result.current.fitTimelineToContent();
      });

      // Should be close to content duration (with minimum)
      expect(result.current.duration).toBe(150); // 5s minimum
    });

    it('should auto-adjust timeline', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add content
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 200,
          type: 'video',
        });
      });

      // Set timeline shorter than content
      act(() => {
        result.current.setDuration(150);
      });

      // Auto-adjust should extend it
      act(() => {
        result.current.autoAdjustTimeline();
      });

      expect(result.current.duration).toBeGreaterThan(200);
    });
  });

  describe('Selection', () => {
    it('should select and deselect items', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add a clip
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
      });

      const clipId = result.current.media[0].id;
      expect(result.current.selectedId).toBe(clipId); // Auto-selected

      // Deselect
      act(() => {
        result.current.selectItem(null);
      });
      expect(result.current.selectedId).toBeNull();

      // Select again
      act(() => {
        result.current.selectItem(clipId);
      });
      expect(result.current.selectedId).toBe(clipId);
    });

    it('should get selected item', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // No selection initially
      expect(result.current.getSelectedItem()).toBeNull();

      // Add and select clip
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
      });

      const selectedItem = result.current.getSelectedItem();
      expect(selectedItem).toBeTruthy();
      expect(selectedItem?.id).toBe(result.current.media[0].id);
    });
  });

  describe('Audio Controls', () => {
    it('should set master volume', () => {
      const { result } = renderHook(() => useEditorStore());
      
      act(() => {
        result.current.setMasterVolume(0.5);
      });
      expect(result.current.masterVolume).toBe(0.5);

      // Should clamp to valid range
      act(() => {
        result.current.setMasterVolume(1.5);
      });
      expect(result.current.masterVolume).toBe(1);

      act(() => {
        result.current.setMasterVolume(-0.5);
      });
      expect(result.current.masterVolume).toBe(0);
    });

    it('should toggle mute', () => {
      const { result } = renderHook(() => useEditorStore());
      
      expect(result.current.muted).toBe(false);
      
      act(() => {
        result.current.toggleMute();
      });
      expect(result.current.muted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });
      expect(result.current.muted).toBe(false);
    });

    it('should set clip volume', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add a clip first
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
      });

      const clipId = result.current.media[0].id;

      act(() => {
        result.current.setClipVolume(clipId, 0.7);
      });

      expect(result.current.media[0].volume).toBe(0.7);
    });

    it('should toggle clip mute', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Add a clip first
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
      });

      const clipId = result.current.media[0].id;

      act(() => {
        result.current.toggleClipMute(clipId);
      });

      expect(result.current.media[0].muted).toBe(true);
    });
  });

  describe('Zoom Controls', () => {
    it('should set zoom within bounds', () => {
      const { result } = renderHook(() => useEditorStore());
      
      act(() => {
        result.current.setZoom(2);
      });
      expect(result.current.zoom).toBe(2);

      // Should clamp to valid range
      act(() => {
        result.current.setZoom(15);
      });
      expect(result.current.zoom).toBe(10); // Max zoom

      act(() => {
        result.current.setZoom(0.05);
      });
      expect(result.current.zoom).toBe(0.1); // Min zoom
    });
  });

  describe('Computed Values', () => {
    it('should calculate timeline duration', () => {
      const { result } = renderHook(() => useEditorStore());
      
      expect(result.current.getTimelineDuration()).toBe(0);

      // Add content
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 150,
          type: 'video',
        });
        result.current.addTextOverlay({
          text: 'Hello',
          startFrame: 50,
          endFrame: 200,
          position: { x: 50, y: 50 },
          style: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#ffffff',
            opacity: 1,
            fontWeight: 'normal',
            textAlign: 'center',
          },
        });
      });

      expect(result.current.getTimelineDuration()).toBe(200); // Text ends later
    });
  });

  describe('State Reset', () => {
    it('should reset to default state', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Modify state
      act(() => {
        result.current.addClip({
          src: 'test.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
        result.current.setPlayhead(50);
        result.current.setZoom(2);
      });

      expect(result.current.media).toHaveLength(1);
      expect(result.current.playhead).toBe(50);
      expect(result.current.zoom).toBe(2);

      // Reset
      act(() => {
        result.current.resetState();
      });

      expect(result.current.media).toHaveLength(0);
      expect(result.current.playhead).toBe(0);
      expect(result.current.zoom).toBe(1);
    });
  });
});
