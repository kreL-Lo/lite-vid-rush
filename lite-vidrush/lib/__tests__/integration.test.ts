/**
 * Integration tests for key user workflows
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from '../store';
import { DEFAULT_EDITOR_STATE } from '../types';

describe('Integration Tests - User Workflows', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useEditorStore());
    act(() => {
      result.current.resetState();
    });
  });

  describe('Basic Video Editing Workflow', () => {
    it('should handle complete clip editing workflow', () => {
      const { result } = renderHook(() => useEditorStore());

      // 1. Add a video clip
      act(() => {
        result.current.addClip({
          src: 'video1.mp4',
          startFrame: 0,
          endFrame: 150, // 5 seconds at 30fps
          type: 'video',
        });
      });

      expect(result.current.media).toHaveLength(1);
      expect(result.current.duration).toBeGreaterThan(150); // Auto-extended
      const clipId = result.current.media[0].id;

      // 2. Add another clip
      act(() => {
        result.current.addClip({
          src: 'video2.mp4',
          startFrame: 150,
          endFrame: 300, // Another 5 seconds
          type: 'video',
        });
      });

      expect(result.current.media).toHaveLength(2);
      expect(result.current.duration).toBeGreaterThan(300);

      // 3. Trim the first clip
      act(() => {
        result.current.trimClip(clipId, 30, 120); // Trim to 3 seconds
      });

      expect(result.current.media[0].startFrame).toBe(30);
      expect(result.current.media[0].endFrame).toBe(120);

      // 4. Add text overlay
      act(() => {
        result.current.addTextOverlay({
          text: 'Hello World',
          startFrame: 60,
          endFrame: 180,
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

      // 5. Play and scrub
      act(() => {
        result.current.play();
      });
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.setPlayhead(90);
      });
      expect(result.current.playhead).toBe(90);

      // 6. Check what's visible at current frame
      const contentDuration = result.current.getTimelineDuration();
      expect(contentDuration).toBe(300); // Second clip ends at 300

      // 7. Fit timeline to content
      act(() => {
        result.current.fitTimelineToContent();
      });
      expect(result.current.duration).toBe(300); // Should fit exactly (with minimum)
    });
  });

  describe('Timeline Extension Workflow', () => {
    it('should handle unlimited track expansion', () => {
      const { result } = renderHook(() => useEditorStore());

      // 1. Add a clip within normal range
      act(() => {
        result.current.addClip({
          src: 'video.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });
      });

      const clipId = result.current.media[0].id;
      const initialDuration = result.current.duration;

      // 2. Extend clip far beyond current timeline
      act(() => {
        result.current.updateClip(clipId, { endFrame: 2000 }); // ~66 seconds
      });

      expect(result.current.media[0].endFrame).toBe(2000);
      expect(result.current.duration).toBeGreaterThan(initialDuration);
      expect(result.current.duration).toBeGreaterThan(2000);

      // 3. Timeline should auto-adjust to accommodate
      const newContentDuration = result.current.getTimelineDuration();
      expect(newContentDuration).toBe(2000);

      // 4. Zoom to fit should work with large timeline
      act(() => {
        result.current.setZoom(0.1); // Zoom out to see everything
      });
      expect(result.current.zoom).toBe(0.1);
    });
  });

  describe('Multi-Track Workflow', () => {
    it('should handle video, audio, and text tracks', () => {
      const { result } = renderHook(() => useEditorStore());

      // 1. Add video track
      act(() => {
        result.current.addClip({
          src: 'video.mp4',
          startFrame: 0,
          endFrame: 300,
          type: 'video',
        });
      });

      // 2. Add audio track
      act(() => {
        result.current.addClip({
          src: 'audio.mp3',
          startFrame: 0,
          endFrame: 450, // Longer than video
          type: 'audio',
        });
      });

      // 3. Add multiple text overlays
      act(() => {
        result.current.addTextOverlay({
          text: 'Title',
          startFrame: 0,
          endFrame: 60,
          position: { x: 50, y: 20 },
          style: {
            fontSize: 32,
            fontFamily: 'Arial',
            color: '#ffffff',
            opacity: 1,
            fontWeight: 'bold',
            textAlign: 'center',
          },
        });

        result.current.addTextOverlay({
          text: 'Subtitle',
          startFrame: 60,
          endFrame: 300,
          position: { x: 50, y: 80 },
          style: {
            fontSize: 18,
            fontFamily: 'Arial',
            color: '#cccccc',
            opacity: 0.8,
            fontWeight: 'normal',
            textAlign: 'center',
          },
        });
      });

      expect(result.current.media).toHaveLength(2); // Video + Audio
      expect(result.current.texts).toHaveLength(2); // Two text overlays

      // 4. Timeline should extend to longest item (audio at 450)
      const contentDuration = result.current.getTimelineDuration();
      expect(contentDuration).toBe(450);

      // 5. Check items at different frames
      const videoClips = result.current.media.filter(c => c.type === 'video');
      const audioClips = result.current.media.filter(c => c.type === 'audio');
      
      expect(videoClips).toHaveLength(1);
      expect(audioClips).toHaveLength(1);

      // 6. Audio should be longer than video
      expect(audioClips[0].endFrame).toBeGreaterThan(videoClips[0].endFrame);
    });
  });

  describe('Volume and Audio Workflow', () => {
    it('should handle audio controls', () => {
      const { result } = renderHook(() => useEditorStore());

      // 1. Add audio clip
      act(() => {
        result.current.addClip({
          src: 'music.mp3',
          startFrame: 0,
          endFrame: 300,
          type: 'audio',
          volume: 0.8,
        });
      });

      const clipId = result.current.media[0].id;

      // 2. Test master volume controls
      act(() => {
        result.current.setMasterVolume(0.5);
      });
      expect(result.current.masterVolume).toBe(0.5);

      act(() => {
        result.current.toggleMute();
      });
      expect(result.current.muted).toBe(true);

      // 3. Test clip-specific volume controls
      act(() => {
        result.current.setClipVolume(clipId, 0.3);
      });
      expect(result.current.media[0].volume).toBe(0.3);

      act(() => {
        result.current.toggleClipMute(clipId);
      });
      expect(result.current.media[0].muted).toBe(true);

      // 4. Unmute everything
      act(() => {
        result.current.toggleMute();
        result.current.toggleClipMute(clipId);
      });
      expect(result.current.muted).toBe(false);
      expect(result.current.media[0].muted).toBe(false);
    });
  });

  describe('Selection and Editing Workflow', () => {
    it('should handle item selection and editing', () => {
      const { result } = renderHook(() => useEditorStore());

      // 1. Add multiple items
      act(() => {
        result.current.addClip({
          src: 'video.mp4',
          startFrame: 0,
          endFrame: 150,
          type: 'video',
        });
      });

      const videoId = result.current.media[0].id;

      act(() => {
        result.current.addTextOverlay({
          text: 'Original Text',
          startFrame: 50,
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

      // 2. Test selection
      expect(result.current.selectedId).toBe(textId); // Last added is selected

      act(() => {
        result.current.selectItem(videoId);
      });
      expect(result.current.selectedId).toBe(videoId);

      const selectedItem = result.current.getSelectedItem();
      expect(selectedItem?.id).toBe(videoId);

      // 3. Edit selected video clip
      act(() => {
        result.current.updateClip(videoId, {
          position: { x: 25, y: 25 },
          scale: { width: 0.8, height: 0.8 },
        });
      });

      expect(result.current.media[0].position).toEqual({ x: 25, y: 25 });
      expect(result.current.media[0].scale).toEqual({ width: 0.8, height: 0.8 });

      // 4. Select and edit text
      act(() => {
        result.current.selectItem(textId);
      });

      act(() => {
        result.current.updateTextOverlay(textId, {
          text: 'Updated Text',
          style: {
            fontSize: 32,
            fontFamily: 'Arial',
            color: '#ff0000',
            opacity: 1,
            fontWeight: 'bold',
            textAlign: 'left',
          },
        });
      });

      expect(result.current.texts[0].text).toBe('Updated Text');
      expect(result.current.texts[0].style.fontSize).toBe(32);
      expect(result.current.texts[0].style.color).toBe('#ff0000');
    });
  });

  describe('Complex Timeline Operations', () => {
    it('should handle complex reordering and trimming', () => {
      const { result } = renderHook(() => useEditorStore());

      // 1. Add multiple clips
      act(() => {
        result.current.addClip({
          src: 'clip1.mp4',
          startFrame: 0,
          endFrame: 100,
          type: 'video',
        });

        result.current.addClip({
          src: 'clip2.mp4',
          startFrame: 100,
          endFrame: 200,
          type: 'video',
        });

        result.current.addClip({
          src: 'clip3.mp4',
          startFrame: 200,
          endFrame: 300,
          type: 'video',
        });
      });

      expect(result.current.media).toHaveLength(3);
      expect(result.current.media[0].order).toBe(0);
      expect(result.current.media[1].order).toBe(1);
      expect(result.current.media[2].order).toBe(2);

      // 2. Reorder clips (move first to last)
      act(() => {
        result.current.reorderClips(0, 2);
      });

      expect(result.current.media[0].order).toBe(0);
      expect(result.current.media[1].order).toBe(1);
      expect(result.current.media[2].order).toBe(2);
      // The clip that was first should now be last
      expect(result.current.media[2].src).toBe('clip1.mp4');

      // 3. Trim clips to create gaps
      const clip1Id = result.current.media.find(c => c.src === 'clip1.mp4')?.id;
      const clip2Id = result.current.media.find(c => c.src === 'clip2.mp4')?.id;

      if (clip1Id && clip2Id) {
        act(() => {
          result.current.trimClip(clip1Id, 0, 80); // Shorter
          result.current.trimClip(clip2Id, 120, 180); // Gap before it
        });

        const clip1 = result.current.media.find(c => c.id === clip1Id);
        const clip2 = result.current.media.find(c => c.id === clip2Id);

        expect(clip1?.endFrame).toBe(80);
        expect(clip2?.startFrame).toBe(120);
      }

      // 4. Check timeline duration calculation
      const contentDuration = result.current.getTimelineDuration();
      expect(contentDuration).toBe(300); // Last clip still ends at 300
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle edge cases gracefully', () => {
      const { result } = renderHook(() => useEditorStore());

      // 1. Try to select non-existent item
      act(() => {
        result.current.selectItem('non-existent-id');
      });
      expect(result.current.selectedId).toBe('non-existent-id'); // Store allows this
      expect(result.current.getSelectedItem()).toBeNull(); // But returns null

      // 2. Try to update non-existent clip
      act(() => {
        result.current.updateClip('non-existent-id', { endFrame: 500 });
      });
      // Should not crash, just do nothing

      // 3. Try to remove non-existent item
      act(() => {
        result.current.removeItem('non-existent-id');
      });
      // Should not crash

      // 4. Set invalid playhead values
      act(() => {
        result.current.setPlayhead(-100);
      });
      expect(result.current.playhead).toBe(0); // Clamped

      act(() => {
        result.current.setPlayhead(99999);
      });
      expect(result.current.playhead).toBe(result.current.duration); // Clamped

      // 5. Set invalid zoom values
      act(() => {
        result.current.setZoom(-1);
      });
      expect(result.current.zoom).toBe(0.1); // Clamped to minimum

      act(() => {
        result.current.setZoom(100);
      });
      expect(result.current.zoom).toBe(10); // Clamped to maximum
    });
  });
});
