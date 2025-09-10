/**
 * Unit tests for timeline operations
 */

import { describe, it, expect } from 'vitest';
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
  getTimelineItems,
  getItemsAtFrame,
  calculateTimelineDuration,
  autoAdjustTimelineDuration,
  fitTimelineToContent,
  getMinimumTimelineDuration,
  getOptimalTimelineDuration,
  framesToTime,
  timeToFrames,
  validateTimelineState,
} from '../timelineOps';
import { DEFAULT_EDITOR_STATE, EditorState, Clip, TextOverlay } from '../types';

describe('Timeline Operations', () => {
  describe('addClip', () => {
    it('should add a clip to empty timeline', () => {
      const state = DEFAULT_EDITOR_STATE;
      const clipData = {
        src: 'test.mp4',
        startFrame: 0,
        endFrame: 100,
        type: 'video' as const,
      };

      const newState = addClip(state, clipData);

      expect(newState.media).toHaveLength(1);
      expect(newState.media[0]).toMatchObject({
        ...clipData,
        order: 0,
      });
      expect(newState.media[0].id).toBeDefined();
      expect(newState.selectedId).toBe(newState.media[0].id);
    });

    it('should add clip with correct order', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: '1',
            src: 'test1.mp4',
            startFrame: 0,
            endFrame: 50,
            order: 0,
            type: 'video',
          },
        ],
      };

      const newClip = {
        src: 'test2.mp4',
        startFrame: 50,
        endFrame: 100,
        type: 'video' as const,
      };

      const newState = addClip(state, newClip);

      expect(newState.media).toHaveLength(2);
      expect(newState.media[1].order).toBe(1);
    });
  });

  describe('addTextOverlay', () => {
    it('should add text overlay to timeline', () => {
      const state = DEFAULT_EDITOR_STATE;
      const textData = {
        text: 'Hello World',
        startFrame: 10,
        endFrame: 60,
        position: { x: 50, y: 50 },
        style: {
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#ffffff',
          opacity: 1,
          fontWeight: 'normal' as const,
          textAlign: 'center' as const,
        },
      };

      const newState = addTextOverlay(state, textData);

      expect(newState.texts).toHaveLength(1);
      expect(newState.texts[0]).toMatchObject(textData);
      expect(newState.texts[0].id).toBeDefined();
      expect(newState.selectedId).toBe(newState.texts[0].id);
    });
  });

  describe('removeItem', () => {
    it('should remove clip by id', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test1.mp4',
            startFrame: 0,
            endFrame: 50,
            order: 0,
            type: 'video',
          },
          {
            id: 'clip2',
            src: 'test2.mp4',
            startFrame: 50,
            endFrame: 100,
            order: 1,
            type: 'video',
          },
        ],
        selectedId: 'clip1',
      };

      const newState = removeItem(state, 'clip1');

      expect(newState.media).toHaveLength(1);
      expect(newState.media[0].id).toBe('clip2');
      expect(newState.media[0].order).toBe(0); // Reordered
      expect(newState.selectedId).toBeNull();
    });

    it('should remove text overlay by id', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        texts: [
          {
            id: 'text1',
            text: 'Hello',
            startFrame: 0,
            endFrame: 50,
            position: { x: 50, y: 50 },
            style: {
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#ffffff',
              opacity: 1,
              fontWeight: 'normal',
              textAlign: 'center',
            },
          },
        ],
        selectedId: 'text1',
      };

      const newState = removeItem(state, 'text1');

      expect(newState.texts).toHaveLength(0);
      expect(newState.selectedId).toBeNull();
    });
  });

  describe('trimClip', () => {
    it('should trim clip duration', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test.mp4',
            startFrame: 0,
            endFrame: 100,
            order: 0,
            type: 'video',
          },
        ],
      };

      const newState = trimClip(state, 'clip1', 10, 90);

      expect(newState.media[0].startFrame).toBe(10);
      expect(newState.media[0].endFrame).toBe(90);
    });

    it('should enforce minimum duration', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test.mp4',
            startFrame: 0,
            endFrame: 100,
            order: 0,
            type: 'video',
          },
        ],
      };

      const newState = trimClip(state, 'clip1', 50, 50);

      expect(newState.media[0].startFrame).toBe(50);
      expect(newState.media[0].endFrame).toBe(51); // Minimum 1 frame duration
    });

    it('should not allow negative start frame', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test.mp4',
            startFrame: 10,
            endFrame: 100,
            order: 0,
            type: 'video',
          },
        ],
      };

      const newState = trimClip(state, 'clip1', -5, 90);

      expect(newState.media[0].startFrame).toBe(0);
      expect(newState.media[0].endFrame).toBe(90);
    });
  });

  describe('reorderClips', () => {
    it('should reorder clips correctly', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test1.mp4',
            startFrame: 0,
            endFrame: 50,
            order: 0,
            type: 'video',
          },
          {
            id: 'clip2',
            src: 'test2.mp4',
            startFrame: 50,
            endFrame: 100,
            order: 1,
            type: 'video',
          },
          {
            id: 'clip3',
            src: 'test3.mp4',
            startFrame: 100,
            endFrame: 150,
            order: 2,
            type: 'video',
          },
        ],
      };

      const newState = reorderClips(state, 0, 2); // Move first clip to end

      expect(newState.media[0].id).toBe('clip2');
      expect(newState.media[0].order).toBe(0);
      expect(newState.media[1].id).toBe('clip3');
      expect(newState.media[1].order).toBe(1);
      expect(newState.media[2].id).toBe('clip1');
      expect(newState.media[2].order).toBe(2);
    });
  });

  describe('setPlayhead', () => {
    it('should set playhead position', () => {
      const state = DEFAULT_EDITOR_STATE;
      const newState = setPlayhead(state, 150);

      expect(newState.playhead).toBe(150);
      expect(newState.isPlaying).toBe(false); // Should stop playback
    });

    it('should clamp playhead to duration', () => {
      const state = { ...DEFAULT_EDITOR_STATE, duration: 300 };
      const newState = setPlayhead(state, 500);

      expect(newState.playhead).toBe(300);
    });

    it('should not allow negative playhead', () => {
      const state = DEFAULT_EDITOR_STATE;
      const newState = setPlayhead(state, -50);

      expect(newState.playhead).toBe(0);
    });
  });

  describe('togglePlayback', () => {
    it('should toggle playing state', () => {
      const state = { ...DEFAULT_EDITOR_STATE, isPlaying: false };
      const newState = togglePlayback(state);

      expect(newState.isPlaying).toBe(true);

      const newState2 = togglePlayback(newState);
      expect(newState2.isPlaying).toBe(false);
    });
  });

  describe('setZoom', () => {
    it('should set zoom level', () => {
      const state = DEFAULT_EDITOR_STATE;
      const newState = setZoom(state, 2.0);

      expect(newState.zoom).toBe(2.0);
    });

    it('should clamp zoom to valid range', () => {
      const state = DEFAULT_EDITOR_STATE;
      
      const tooSmall = setZoom(state, 0.05);
      expect(tooSmall.zoom).toBe(0.1);

      const tooLarge = setZoom(state, 15);
      expect(tooLarge.zoom).toBe(10);
    });
  });

  describe('getTimelineItems', () => {
    it('should return all items sorted by start frame', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test1.mp4',
            startFrame: 50,
            endFrame: 100,
            order: 0,
            type: 'video',
          },
        ],
        texts: [
          {
            id: 'text1',
            text: 'Hello',
            startFrame: 10,
            endFrame: 60,
            position: { x: 50, y: 50 },
            style: {
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#ffffff',
              opacity: 1,
              fontWeight: 'normal',
              textAlign: 'center',
            },
          },
        ],
      };

      const items = getTimelineItems(state);

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe('text1'); // Should be first (starts at frame 10)
      expect(items[1].id).toBe('clip1'); // Should be second (starts at frame 50)
    });
  });

  describe('getItemsAtFrame', () => {
    it('should return items visible at specific frame', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test1.mp4',
            startFrame: 0,
            endFrame: 50,
            order: 0,
            type: 'video',
          },
          {
            id: 'clip2',
            src: 'test2.mp4',
            startFrame: 40,
            endFrame: 90,
            order: 1,
            type: 'video',
          },
        ],
      };

      const itemsAt25 = getItemsAtFrame(state, 25);
      expect(itemsAt25).toHaveLength(1);
      expect(itemsAt25[0].id).toBe('clip1');

      const itemsAt45 = getItemsAtFrame(state, 45);
      expect(itemsAt45).toHaveLength(2);

      const itemsAt70 = getItemsAtFrame(state, 70);
      expect(itemsAt70).toHaveLength(1);
      expect(itemsAt70[0].id).toBe('clip2');
    });
  });

  describe('calculateTimelineDuration', () => {
    it('should calculate total duration from clips and texts', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test1.mp4',
            startFrame: 0,
            endFrame: 100,
            order: 0,
            type: 'video',
          },
        ],
        texts: [
          {
            id: 'text1',
            text: 'Hello',
            startFrame: 50,
            endFrame: 150,
            position: { x: 50, y: 50 },
            style: {
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#ffffff',
              opacity: 1,
              fontWeight: 'normal',
              textAlign: 'center',
            },
          },
        ],
      };

      const duration = calculateTimelineDuration(state);
      expect(duration).toBe(150); // Should be the maximum end frame
    });
  });

  describe('framesToTime', () => {
    it('should convert frames to time string', () => {
      expect(framesToTime(0, 30)).toBe('00:00');
      expect(framesToTime(30, 30)).toBe('00:01');
      expect(framesToTime(90, 30)).toBe('00:03');
      expect(framesToTime(1800, 30)).toBe('01:00');
      expect(framesToTime(3690, 30)).toBe('02:03');
    });
  });

  describe('timeToFrames', () => {
    it('should convert time string to frames', () => {
      expect(timeToFrames('00:00', 30)).toBe(0);
      expect(timeToFrames('00:01', 30)).toBe(30);
      expect(timeToFrames('00:03', 30)).toBe(90);
      expect(timeToFrames('01:00', 30)).toBe(1800);
      expect(timeToFrames('02:03', 30)).toBe(3690);
    });
  });

  describe('validateTimelineState', () => {
    it('should return no errors for valid state', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test1.mp4',
            startFrame: 0,
            endFrame: 50,
            order: 0,
            type: 'video',
          },
          {
            id: 'clip2',
            src: 'test2.mp4',
            startFrame: 60,
            endFrame: 100,
            order: 1,
            type: 'video',
          },
        ],
      };

      const errors = validateTimelineState(state);
      expect(errors).toHaveLength(0);
    });

    it('should detect overlapping clips', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test1.mp4',
            startFrame: 0,
            endFrame: 60,
            order: 0,
            type: 'video',
          },
          {
            id: 'clip2',
            src: 'test2.mp4',
            startFrame: 50,
            endFrame: 100,
            order: 1,
            type: 'video',
          },
        ],
      };

      const errors = validateTimelineState(state);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('overlaps');
    });

    it('should detect invalid frame ranges', () => {
      const state: EditorState = {
        ...DEFAULT_EDITOR_STATE,
        media: [
          {
            id: 'clip1',
            src: 'test1.mp4',
            startFrame: 50,
            endFrame: 50,
            order: 0,
            type: 'video',
          },
          {
            id: 'clip2',
            src: 'test2.mp4',
            startFrame: -10,
            endFrame: 40,
            order: 1,
            type: 'video',
          },
        ],
      };

      const errors = validateTimelineState(state);
      expect(errors).toHaveLength(2);
      expect(errors.some(e => e.includes('invalid frame range'))).toBe(true);
      expect(errors.some(e => e.includes('negative start frame'))).toBe(true);
    });
  });

  describe('Auto Timeline Duration Management', () => {
    describe('getMinimumTimelineDuration', () => {
      it('should return 0 for empty timeline', () => {
        const state = DEFAULT_EDITOR_STATE;
        const duration = getMinimumTimelineDuration(state);
        expect(duration).toBe(0);
      });

      it('should return max end frame of all items', () => {
        const state: EditorState = {
          ...DEFAULT_EDITOR_STATE,
          media: [
            {
              id: 'clip1',
              src: 'test.mp4',
              startFrame: 0,
              endFrame: 150,
              order: 0,
              type: 'video',
            },
          ],
          texts: [
            {
              id: 'text1',
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
            },
          ],
        };

        const duration = getMinimumTimelineDuration(state);
        expect(duration).toBe(200); // Text ends at frame 200
      });
    });

    describe('getOptimalTimelineDuration', () => {
      it('should add buffer to content duration', () => {
        const state: EditorState = {
          ...DEFAULT_EDITOR_STATE,
          frameRate: 30,
          media: [
            {
              id: 'clip1',
              src: 'test.mp4',
              startFrame: 0,
              endFrame: 100,
              order: 0,
              type: 'video',
            },
          ],
        };

        const duration = getOptimalTimelineDuration(state, 2); // 2 second buffer
        expect(duration).toBe(300); // Respects 10s minimum (300 frames)
      });

      it('should respect minimum duration', () => {
        const state: EditorState = {
          ...DEFAULT_EDITOR_STATE,
          frameRate: 30,
        };

        const duration = getOptimalTimelineDuration(state);
        expect(duration).toBe(300); // 10 seconds minimum
      });
    });

    describe('autoAdjustTimelineDuration', () => {
      it('should extend timeline to fit content with buffer', () => {
        const state: EditorState = {
          ...DEFAULT_EDITOR_STATE,
          frameRate: 30,
          duration: 50,
          media: [
            {
              id: 'clip1',
              src: 'test.mp4',
              startFrame: 0,
              endFrame: 100,
              order: 0,
              type: 'video',
            },
          ],
        };

        const newState = autoAdjustTimelineDuration(state);
        expect(newState.duration).toBeGreaterThan(100); // Should be extended
        expect(newState.duration).toBe(300); // Respects 10s minimum (300 frames)
      });

      it('should not shrink timeline automatically', () => {
        const state: EditorState = {
          ...DEFAULT_EDITOR_STATE,
          frameRate: 30,
          duration: 500,
          media: [
            {
              id: 'clip1',
              src: 'test.mp4',
              startFrame: 0,
              endFrame: 100,
              order: 0,
              type: 'video',
            },
          ],
        };

        const newState = autoAdjustTimelineDuration(state);
        expect(newState.duration).toBe(500); // Should stay the same
      });
    });

    describe('fitTimelineToContent', () => {
      it('should fit timeline exactly to content', () => {
        const state: EditorState = {
          ...DEFAULT_EDITOR_STATE,
          frameRate: 30,
          duration: 500,
          media: [
            {
              id: 'clip1',
              src: 'test.mp4',
              startFrame: 0,
              endFrame: 100,
              order: 0,
              type: 'video',
            },
          ],
        };

        const newState = fitTimelineToContent(state);
        expect(newState.duration).toBe(150); // Respects 5s minimum (150 frames)
      });

      it('should respect minimum duration', () => {
        const state: EditorState = {
          ...DEFAULT_EDITOR_STATE,
          frameRate: 30,
          duration: 500,
        };

        const newState = fitTimelineToContent(state);
        expect(newState.duration).toBe(150); // 5 seconds minimum
      });
    });
  });
});
