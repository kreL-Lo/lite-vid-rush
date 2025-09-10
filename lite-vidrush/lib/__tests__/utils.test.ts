/**
 * Unit tests for utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatFileSize,
  formatDuration,
  framesToTime,
  clamp,
  debounce,
  throttle,
  generateRandomColor,
  isVideoFile,
  isAudioFile,
  isImageFile,
  getMediaType,
  hexToRgba,
  downloadBlob,
  sleep,
  getFileExtension,
  generateTimestampedFilename,
} from '../utils';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('should merge tailwind classes correctly', () => {
      // This tests the tailwind-merge functionality
      expect(cn('p-2', 'p-4')).toBe('p-4'); // Later padding should override
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 * 1024
      expect(formatFileSize(2621440)).toBe('2.5 MB'); // 2.5 * 1024 * 1024
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(30)).toBe('00:30');
      expect(formatDuration(60)).toBe('01:00');
      expect(formatDuration(90)).toBe('01:30');
      expect(formatDuration(3661)).toBe('61:01'); // Over an hour
    });
  });

  describe('framesToTime', () => {
    it('should convert frames to time string', () => {
      expect(framesToTime(0, 30)).toBe('00:00');
      expect(framesToTime(30, 30)).toBe('00:01'); // 1 second at 30fps
      expect(framesToTime(90, 30)).toBe('00:03'); // 3 seconds at 30fps
      expect(framesToTime(1800, 30)).toBe('01:00'); // 1 minute at 30fps
    });

    it('should handle different frame rates', () => {
      expect(framesToTime(60, 60)).toBe('00:01'); // 1 second at 60fps
      expect(framesToTime(25, 25)).toBe('00:01'); // 1 second at 25fps
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5); // Within range
      expect(clamp(-5, 0, 10)).toBe(0); // Below min
      expect(clamp(15, 0, 10)).toBe(10); // Above max
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateRandomColor', () => {
    it('should generate valid hex color', () => {
      const color = generateRandomColor();
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should generate different colors', () => {
      const color1 = generateRandomColor();
      const color2 = generateRandomColor();
      // Very unlikely to be the same (1 in 16 million chance)
      expect(color1).not.toBe(color2);
    });
  });

  describe('File Type Detection', () => {
    describe('isVideoFile', () => {
      it('should detect video files', () => {
        expect(isVideoFile('video.mp4')).toBe(true);
        expect(isVideoFile('video.MOV')).toBe(true); // Case insensitive
        expect(isVideoFile('video.avi')).toBe(true);
        expect(isVideoFile('video.mkv')).toBe(true);
        expect(isVideoFile('video.webm')).toBe(true);
      });

      it('should reject non-video files', () => {
        expect(isVideoFile('audio.mp3')).toBe(false);
        expect(isVideoFile('image.jpg')).toBe(false);
        expect(isVideoFile('document.txt')).toBe(false);
      });
    });

    describe('isAudioFile', () => {
      it('should detect audio files', () => {
        expect(isAudioFile('audio.mp3')).toBe(true);
        expect(isAudioFile('audio.WAV')).toBe(true); // Case insensitive
        expect(isAudioFile('audio.aac')).toBe(true);
        expect(isAudioFile('audio.m4a')).toBe(true);
        expect(isAudioFile('audio.ogg')).toBe(true);
        expect(isAudioFile('audio.flac')).toBe(true);
      });

      it('should reject non-audio files', () => {
        expect(isAudioFile('video.mp4')).toBe(false);
        expect(isAudioFile('image.jpg')).toBe(false);
      });
    });

    describe('isImageFile', () => {
      it('should detect image files', () => {
        expect(isImageFile('image.jpg')).toBe(true);
        expect(isImageFile('image.JPEG')).toBe(true); // Case insensitive
        expect(isImageFile('image.png')).toBe(true);
        expect(isImageFile('image.gif')).toBe(true);
        expect(isImageFile('image.bmp')).toBe(true);
        expect(isImageFile('image.webp')).toBe(true);
      });

      it('should reject non-image files', () => {
        expect(isImageFile('video.mp4')).toBe(false);
        expect(isImageFile('audio.mp3')).toBe(false);
      });
    });

    describe('getMediaType', () => {
      it('should return correct media types', () => {
        expect(getMediaType('video.mp4')).toBe('video');
        expect(getMediaType('audio.mp3')).toBe('audio');
        expect(getMediaType('image.jpg')).toBe('image');
        expect(getMediaType('document.txt')).toBe('unknown');
      });
    });
  });

  describe('hexToRgba', () => {
    it('should convert hex to rgba', () => {
      expect(hexToRgba('#ffffff')).toBe('rgba(255, 255, 255, 1)');
      expect(hexToRgba('#000000')).toBe('rgba(0, 0, 0, 1)');
      expect(hexToRgba('#ff0000')).toBe('rgba(255, 0, 0, 1)');
    });

    it('should handle alpha parameter', () => {
      expect(hexToRgba('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
      expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
    });
  });

  describe('downloadBlob', () => {
    it('should create download link', () => {
      // Mock DOM methods and URL
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      
      // Mock URL methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const blob = new Blob(['test'], { type: 'text/plain' });
      downloadBlob(blob, 'test.txt');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test.txt');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();

      // Restore mocks
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should resolve after delay', async () => {
      const promise = sleep(1000);
      
      let resolved = false;
      promise.then(() => { resolved = true; });

      expect(resolved).toBe(false);
      
      vi.advanceTimersByTime(1000);
      await promise;
      
      expect(resolved).toBe(true);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('video.mp4')).toBe('mp4');
      expect(getFileExtension('path/to/file.jpeg')).toBe('jpeg');
      expect(getFileExtension('file.with.dots.png')).toBe('png');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('filename')).toBe('');
      expect(getFileExtension('path/filename')).toBe('');
    });
  });

  describe('generateTimestampedFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = generateTimestampedFilename('export', 'mp4');
      
      expect(filename).toMatch(/^export_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/);
    });

    it('should use provided prefix and extension', () => {
      const filename = generateTimestampedFilename('video', 'webm');
      
      expect(filename.startsWith('video_')).toBe(true);
      expect(filename.endsWith('.webm')).toBe(true);
    });
  });
});
