/**
 * ClipItem Component
 * Represents a single clip in the timeline with drag and resize functionality
 */

import React, { useState, useRef } from 'react';
import { Clip, TextOverlay } from '@/lib/types';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Trash2, Type, Video, Music, Image, GripVertical } from 'lucide-react';

interface ClipItemProps {
  item: Clip | TextOverlay;
  type: 'clip' | 'text';
  pixelsPerFrame: number;
}

export const ClipItem: React.FC<ClipItemProps> = ({ item, type, pixelsPerFrame }) => {
  const { selectedId, selectItem, removeItem, updateClip, updateTextOverlay, trimClip, trimTextOverlay, duration } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const clipRef = useRef<HTMLDivElement>(null);
  const isSelected = selectedId === item.id;

  const width = (item.endFrame - item.startFrame) * pixelsPerFrame;
  const left = item.startFrame * pixelsPerFrame;
  const minWidth = 30; // Minimum clip width in pixels

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectItem(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeItem(item.id);
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      e.preventDefault();
      e.stopPropagation();

      const rect = clipRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setIsDragging(true);
        selectItem(item.id);
      }
    }
  };

  // Resize functionality
  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(side);
    selectItem(item.id);
  };

  // Mouse move handler
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const timelineRect = clipRef.current?.parentElement?.getBoundingClientRect();
        if (timelineRect) {
          const newLeft = e.clientX - timelineRect.left - dragOffset.x;
          const clipDuration = item.endFrame - item.startFrame;

          // Calculate new start frame with minimal constraints (only prevent negative start)
          let newStartFrame = Math.max(0, Math.round(newLeft / pixelsPerFrame));
          let newEndFrame = newStartFrame + clipDuration;

          // No timeline duration constraint - clips can extend beyond timeline

          // Update clip position
          if (type === 'clip') {
            updateClip(item.id, {
              startFrame: newStartFrame,
              endFrame: newEndFrame,
            });
          } else {
            updateTextOverlay(item.id, {
              startFrame: newStartFrame,
              endFrame: newEndFrame,
            });
          }
        }
      } else if (isResizing) {
        const timelineRect = clipRef.current?.parentElement?.getBoundingClientRect();
        if (timelineRect) {
          const mouseFrame = Math.round((e.clientX - timelineRect.left) / pixelsPerFrame);

          if (isResizing === 'left') {
            // Resize from left (trim start)
            const newStartFrame = Math.max(0, Math.min(mouseFrame, item.endFrame - 10)); // Min 10 frames
            if (type === 'clip') {
              trimClip(item.id, newStartFrame, item.endFrame);
            } else {
              trimTextOverlay(item.id, newStartFrame, item.endFrame);
            }
          } else if (isResizing === 'right') {
            // Resize from right (trim end) - no timeline duration constraint
            const newEndFrame = Math.max(item.startFrame + 10, mouseFrame); // Min 10 frames, no max limit
            if (type === 'clip') {
              trimClip(item.id, item.startFrame, newEndFrame);
            } else {
              trimTextOverlay(item.id, item.startFrame, newEndFrame);
            }
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDragging ? 'grabbing' : 'ew-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isResizing, dragOffset, pixelsPerFrame, item, type, updateClip, updateTextOverlay, trimClip, trimTextOverlay, duration]);

  const getIcon = () => {
    if (type === 'text') return <Type size={12} />;

    const clip = item as Clip;
    switch (clip.type) {
      case 'video': return <Video size={12} />;
      case 'audio': return <Music size={12} />;
      case 'image': return <Image size={12} />;
      default: return <Video size={12} />;
    }
  };

  const getColor = () => {
    if (type === 'text') return 'bg-purple-500';

    const clip = item as Clip;
    switch (clip.type) {
      case 'video': return 'bg-blue-500';
      case 'audio': return 'bg-green-500';
      case 'image': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTitle = () => {
    if (type === 'text') {
      const textItem = item as TextOverlay;
      return textItem.text.slice(0, 20) + (textItem.text.length > 20 ? '...' : '');
    }

    const clip = item as Clip;
    const filename = clip.src.split('/').pop() || 'Unknown';
    return filename.slice(0, 20) + (filename.length > 20 ? '...' : '');
  };

  return (
    <div
      ref={clipRef}
      className={cn(
        'absolute top-0 h-12 rounded border-2 border-transparent group transition-all select-none',
        getColor(),
        isSelected && 'border-white shadow-lg ring-2 ring-white/20',
        isDragging && 'cursor-grabbing opacity-80 z-10',
        !isDragging && 'cursor-grab hover:brightness-110'
      )}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, minWidth)}px`,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Left resize handle */}
      <div
        className={cn(
          'absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity',
          isResizing === 'left' && 'opacity-100 bg-white/60'
        )}
        onMouseDown={(e) => handleResizeStart(e, 'left')}
      />

      {/* Right resize handle */}
      <div
        className={cn(
          'absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity',
          isResizing === 'right' && 'opacity-100 bg-white/60'
        )}
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />

      {/* Clip content */}
      <div className="flex items-center h-full px-2 text-white text-xs pointer-events-none">
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          <GripVertical size={10} className="drag-handle pointer-events-auto opacity-50" />
          {getIcon()}
          <span className="truncate font-medium">
            {getTitle()}
          </span>
        </div>
      </div>

      {/* Delete button - only show on hover or when selected */}
      <button
        onClick={handleDelete}
        className={cn(
          'absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/20 rounded pointer-events-auto',
          isSelected && 'opacity-100'
        )}
      >
        <Trash2 size={10} />
      </button>

      {/* Duration indicator */}
      {isSelected && (
        <div className="absolute -bottom-5 left-0 text-xs text-gray-400">
          {((item.endFrame - item.startFrame) / 30).toFixed(1)}s
        </div>
      )}

      {/* Frame indicators */}
      {isSelected && (
        <div className="absolute -top-5 left-0 text-xs text-gray-400">
          {item.startFrame}-{item.endFrame}
        </div>
      )}
    </div>
  );
};

// TODO: Implement drag and drop functionality
// TODO: Add resize handles for trimming clips
// TODO: Add context menu for clip operations
// TODO: Add thumbnail preview for video clips
// TODO: Add waveform visualization for audio clips
