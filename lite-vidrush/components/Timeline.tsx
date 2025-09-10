/**
 * Timeline Component
 * Main timeline view showing clips and text overlays
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { ClipItem } from './ClipItem';
import { framesToTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Plus, Minus, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';

export const Timeline: React.FC = () => {
  const {
    media,
    texts,
    playhead,
    duration,
    frameRate,
    zoom,
    setPlayhead,
    selectItem,
    extendTimeline,
    shrinkTimeline,
    fitTimelineToContent,
    autoAdjustTimeline,
    getTimelineDuration,
    setZoom,
  } = useEditorStore();

  // Separate media clips by type
  const videoClips = media.filter(clip => clip.type === 'video' || clip.type === 'image');
  const audioClips = media.filter(clip => clip.type === 'audio');

  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const pixelsPerFrame = zoom * 2; // Base scale: 2 pixels per frame
  const timelineWidth = duration * pixelsPerFrame;
  const minTimelineWidth = 800; // Minimum timeline width for usability

  // Calculate content duration for smart controls
  const contentDuration = getTimelineDuration();
  const hasContent = contentDuration > 0;
  const timelineExtendsContent = duration > contentDuration;

  // Scroll management functions
  const scrollToFrame = useCallback((frame: number) => {
    if (!timelineContainerRef.current) return;

    const container = timelineContainerRef.current;
    const framePosition = frame * pixelsPerFrame;
    const containerWidth = container.clientWidth;
    const scrollLeft = Math.max(0, framePosition - containerWidth / 2);

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  }, [pixelsPerFrame]);

  const scrollToContent = useCallback(() => {
    if (!hasContent) return;
    scrollToFrame(contentDuration / 2); // Scroll to middle of content
  }, [hasContent, contentDuration, scrollToFrame]);

  const scrollToPlayhead = useCallback(() => {
    scrollToFrame(playhead);
  }, [playhead, scrollToFrame]);

  const zoomToFit = useCallback(() => {
    if (!hasContent || !timelineContainerRef.current) return;

    const containerWidth = timelineContainerRef.current.clientWidth;
    const contentWidth = contentDuration * pixelsPerFrame;
    const optimalZoom = Math.min(2, Math.max(0.1, (containerWidth * 0.8) / contentWidth * zoom));

    setZoom(optimalZoom);
    setTimeout(() => scrollToFrame(0), 100); // Scroll to start after zoom
  }, [hasContent, contentDuration, pixelsPerFrame, zoom, setZoom, scrollToFrame]);

  // Auto-scroll to content when timeline is extended significantly
  useEffect(() => {
    if (hasContent && timelineContainerRef.current) {
      const container = timelineContainerRef.current;
      const contentEndPosition = contentDuration * pixelsPerFrame;
      const containerWidth = container.clientWidth;
      const currentScrollRight = container.scrollLeft + containerWidth;
      const buffer = containerWidth * 0.2; // 20% buffer

      // Only scroll if content extends significantly beyond visible area
      if (contentEndPosition > currentScrollRight + buffer) {
        // Scroll to show the end of content with some padding
        scrollToFrame(Math.max(0, contentDuration - containerWidth / pixelsPerFrame / 2));
      }
    }
  }, [contentDuration, pixelsPerFrame, hasContent, scrollToFrame]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!timelineContainerRef.current) return;

      // Only handle keys when timeline is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (isInputFocused) return;

      switch (e.key) {
        case 'Home':
          e.preventDefault();
          scrollToFrame(0);
          break;
        case 'End':
          e.preventDefault();
          if (hasContent) scrollToFrame(contentDuration);
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (hasContent) zoomToFit();
          }
          break;
        case 'g':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            scrollToPlayhead();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasContent, contentDuration, scrollToFrame, zoomToFit, scrollToPlayhead]);

  // Handle timeline click to move playhead
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newFrame = Math.floor(clickX / pixelsPerFrame);

    setPlayhead(Math.max(0, Math.min(newFrame, duration)));
    selectItem(null); // Deselect any selected item
  };

  // Generate time markers
  const generateTimeMarkers = () => {
    const markers = [];
    const markerInterval = Math.max(1, Math.floor(30 / zoom)); // Adjust based on zoom

    for (let frame = 0; frame <= duration; frame += markerInterval * frameRate) {
      markers.push(
        <div
          key={frame}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${frame * pixelsPerFrame}px` }}
        >
          <div className="w-px h-4 bg-gray-400" />
          <span className="text-xs text-gray-500 mt-1">
            {framesToTime(frame, frameRate)}
          </span>
        </div>
      );
    }

    return markers;
  };

  return (
    <div ref={timelineContainerRef} className="flex-1 bg-gray-900 overflow-auto">
      {/* Timeline header with time markers */}
      <div className="h-8 bg-gray-800 border-b border-gray-700 relative">
        <div
          className="relative h-full"
          style={{ width: `${Math.max(timelineWidth, minTimelineWidth)}px` }}
        >
          {generateTimeMarkers()}
        </div>
      </div>

      {/* Timeline content */}
      <div
        ref={timelineRef}
        className="relative cursor-crosshair"
        style={{ width: `${Math.max(timelineWidth, minTimelineWidth)}px` }}
        onClick={handleTimelineClick}
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: Math.ceil(duration / (frameRate * 5)) }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-gray-600"
              style={{ left: `${i * frameRate * 5 * pixelsPerFrame}px` }}
            />
          ))}
        </div>

        {/* Empty timeline area indicator */}
        {hasContent && contentDuration < duration && (
          <div
            className="absolute top-0 bottom-0 bg-gray-800/20 pointer-events-none border-l border-gray-600/30"
            style={{
              left: `${contentDuration * pixelsPerFrame}px`,
              width: `${(duration - contentDuration) * pixelsPerFrame}px`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-800/10" />
          </div>
        )}

        {/* Video Track (Video + Images) */}
        <div className="relative h-16 bg-gray-800/50 border-b border-gray-700">
          <div className="absolute left-2 top-2 text-xs text-gray-400 font-medium flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            Video Track
          </div>
          <div className="relative mt-6">
            {videoClips.map((clip) => (
              <ClipItem
                key={clip.id}
                item={clip}
                type="clip"
                pixelsPerFrame={pixelsPerFrame}
              />
            ))}
          </div>
        </div>

        {/* Audio Track */}
        <div className="relative h-16 bg-gray-800/40 border-b border-gray-700">
          <div className="absolute left-2 top-2 text-xs text-gray-400 font-medium flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            Audio Track
          </div>
          <div className="relative mt-6">
            {audioClips.map((clip) => (
              <ClipItem
                key={clip.id}
                item={clip}
                type="clip"
                pixelsPerFrame={pixelsPerFrame}
              />
            ))}
          </div>
        </div>

        {/* Text Track */}
        <div className="relative h-16 bg-gray-800/30 border-b border-gray-700">
          <div className="absolute left-2 top-2 text-xs text-gray-400 font-medium flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            Text Track
          </div>
          <div className="relative mt-6">
            {texts.map((text) => (
              <ClipItem
                key={text.id}
                item={text}
                type="text"
                pixelsPerFrame={pixelsPerFrame}
              />
            ))}
          </div>
        </div>

        {/* Content End Indicator */}
        {hasContent && contentDuration < duration && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 pointer-events-none z-5 opacity-60"
            style={{ left: `${contentDuration * pixelsPerFrame}px` }}
            title={`Content ends at ${framesToTime(contentDuration, frameRate)}`}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-500 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-500 rounded-full" />
          </div>
        )}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
          style={{ left: `${playhead * pixelsPerFrame}px` }}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 transform rotate-45" />
        </div>

        {/* Drop zones for new clips - TODO: Implement drag and drop */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Video drop zone */}
          <div className="absolute top-6 left-0 right-0 h-12 border-2 border-dashed border-blue-600/30 opacity-0 hover:opacity-50 transition-opacity">
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Drop video/image files here
            </div>
          </div>

          {/* Audio drop zone */}
          <div className="absolute top-22 left-0 right-0 h-12 border-2 border-dashed border-green-600/30 opacity-0 hover:opacity-50 transition-opacity">
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Drop audio files here
            </div>
          </div>

          {/* Text drop zone */}
          <div className="absolute top-38 left-0 right-0 h-12 border-2 border-dashed border-purple-600/30 opacity-0 hover:opacity-50 transition-opacity">
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Drop text overlays here
            </div>
          </div>
        </div>
      </div>

      {/* Timeline controls */}
      <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center px-4 space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Zoom:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(zoom * 0.8)}
            className="px-1 py-1 h-5 w-5"
            title="Zoom out"
            disabled={zoom <= 0.1}
          >
            <Minus size={8} />
          </Button>
          <span className="text-xs text-gray-400 min-w-[3rem] text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(zoom * 1.25)}
            className="px-1 py-1 h-5 w-5"
            title="Zoom in"
            disabled={zoom >= 10}
          >
            <Plus size={8} />
          </Button>
        </div>
        <span className="text-xs text-gray-400">
          Timeline: {framesToTime(duration, frameRate)}
        </span>
        <span className="text-xs text-gray-400">
          Playhead: {framesToTime(playhead, frameRate)}
        </span>

        {/* Timeline indicators legend */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500"></div>
            <span className="text-gray-400">Playhead</span>
          </div>
          {hasContent && contentDuration < duration && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-400">Content End</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-blue-400">
            Video: {videoClips.length}
          </span>
          <span className="text-xs text-green-400">
            Audio: {audioClips.length}
          </span>
          <span className="text-xs text-purple-400">
            Text: {texts.length}
          </span>
        </div>

        {/* Smart Timeline Controls */}
        <div className="flex items-center space-x-2 ml-auto">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-400">Content:</span>
            <span className="text-xs text-blue-400">
              {framesToTime(contentDuration, frameRate)}
            </span>
            {contentDuration > 0 && contentDuration === duration && (
              <span className="text-xs text-green-400" title="Timeline fits content exactly">
                ✓
              </span>
            )}
          </div>

          <div className="w-px h-4 bg-gray-600 mx-2" />

          {/* Viewport controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomToFit}
            className="px-2 py-1 h-6"
            title="Zoom to fit all content (Ctrl+F)"
            disabled={!hasContent}
          >
            <ZoomOut size={12} />
            Fit View
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToContent}
            className="px-2 py-1 h-6"
            title="Scroll to content center"
            disabled={!hasContent}
          >
            <Move size={12} />
            Center
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToPlayhead}
            className="px-2 py-1 h-6"
            title="Scroll to playhead (Ctrl+G)"
          >
            <ZoomIn size={12} />
            Playhead
          </Button>

          <div className="w-px h-4 bg-gray-600 mx-1" />

          {/* Fit to content */}
          <Button
            variant="ghost"
            size="sm"
            onClick={fitTimelineToContent}
            className="px-2 py-1 h-6"
            title="Fit timeline to content"
            disabled={!hasContent}
          >
            <Minimize2 size={12} />
            Fit
          </Button>

          {/* Auto adjust */}
          <Button
            variant="ghost"
            size="sm"
            onClick={autoAdjustTimeline}
            className="px-2 py-1 h-6"
            title="Auto-adjust timeline with buffer"
            disabled={!hasContent}
          >
            <RotateCcw size={12} />
            Auto
          </Button>

          <div className="w-px h-4 bg-gray-600 mx-1" />

          {/* Quick extend */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => extendTimeline(5)}
            className="px-2 py-1 h-6"
            title="Add 5 seconds"
          >
            <Plus size={12} />
            5s
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => extendTimeline(10)}
            className="px-2 py-1 h-6"
            title="Add 10 seconds"
          >
            <Plus size={12} />
            10s
          </Button>

          {/* Quick shrink */}
          {timelineExtendsContent && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => shrinkTimeline(5)}
                className="px-2 py-1 h-6"
                title="Remove 5 seconds"
              >
                <Minus size={12} />
                5s
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => shrinkTimeline(10)}
                className="px-2 py-1 h-6"
                title="Remove 10 seconds"
              >
                <Minus size={12} />
                10s
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// TODO: Implement the following features:
// - Drag and drop support for reordering clips
// - Multiple video/audio tracks
// - Track height adjustment
// - Timeline minimap for navigation
// - Snap to grid functionality
// - Keyboard shortcuts (arrow keys, delete, etc.)
// - Context menu for timeline operations
// - Waveform visualization for audio clips
// - Thumbnail previews for video clips
