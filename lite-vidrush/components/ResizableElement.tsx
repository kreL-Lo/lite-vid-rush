/**
 * ResizableElement Component
 * Provides resize handles and drag functionality for images and text in the preview
 */

import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { Clip, TextOverlay } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ResizableElementProps {
  item: Clip | TextOverlay;
  type: 'clip' | 'text';
  children: React.ReactNode;
  containerWidth: number;
  containerHeight: number;
}

export const ResizableElement: React.FC<ResizableElementProps> = ({
  item,
  type,
  children,
  containerWidth,
  containerHeight,
}) => {
  const { selectedId, selectItem, updateClip, updateTextOverlay } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const elementRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedId === item.id;

  // Default position and scale
  const position = type === 'clip'
    ? (item as Clip).position || { x: 50, y: 50 }
    : (item as TextOverlay).position;

  const scale = item.scale || { width: 1, height: 1 };
  const rotation = item.rotation || 0;

  // Convert percentage position to pixels
  const pixelPosition = {
    x: (position.x / 100) * containerWidth,
    y: (position.y / 100) * containerHeight,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectItem(item.id);
  };

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | string) => {
    e.preventDefault();
    e.stopPropagation();

    selectItem(item.id);

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setElementStart({
        x: position.x,
        y: position.y,
        width: scale.width,
        height: scale.height
      });
    } else {
      setIsResizing(action);
      setDragStart({ x: e.clientX, y: e.clientY });
      setElementStart({
        x: position.x,
        y: position.y,
        width: scale.width,
        height: scale.height
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        // Convert pixel delta to percentage
        const deltaXPercent = (deltaX / containerWidth) * 100;
        const deltaYPercent = (deltaY / containerHeight) * 100;

        const newX = Math.max(0, Math.min(100, elementStart.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100, elementStart.y + deltaYPercent));

        const newPosition = { x: newX, y: newY };

        if (type === 'clip') {
          updateClip(item.id, { position: newPosition });
        } else {
          updateTextOverlay(item.id, { position: newPosition });
        }
      } else if (isResizing) {
        // Calculate scale change based on resize handle
        const scaleFactorX = 1 + (deltaX / containerWidth) * 2; // Adjust sensitivity
        const scaleFactorY = 1 + (deltaY / containerHeight) * 2;

        let newScale = { ...scale };

        switch (isResizing) {
          case 'se': // Southeast - both width and height
            newScale.width = Math.max(0.1, Math.min(3, elementStart.width * scaleFactorX));
            newScale.height = Math.max(0.1, Math.min(3, elementStart.height * scaleFactorY));
            break;
          case 'e': // East - width only
            newScale.width = Math.max(0.1, Math.min(3, elementStart.width * scaleFactorX));
            break;
          case 's': // South - height only
            newScale.height = Math.max(0.1, Math.min(3, elementStart.height * scaleFactorY));
            break;
          case 'sw': // Southwest
            newScale.width = Math.max(0.1, Math.min(3, elementStart.width * (1 - (deltaX / containerWidth) * 2)));
            newScale.height = Math.max(0.1, Math.min(3, elementStart.height * scaleFactorY));
            break;
          case 'w': // West - width only
            newScale.width = Math.max(0.1, Math.min(3, elementStart.width * (1 - (deltaX / containerWidth) * 2)));
            break;
          case 'n': // North - height only
            newScale.height = Math.max(0.1, Math.min(3, elementStart.height * (1 - (deltaY / containerHeight) * 2)));
            break;
          case 'ne': // Northeast
            newScale.width = Math.max(0.1, Math.min(3, elementStart.width * scaleFactorX));
            newScale.height = Math.max(0.1, Math.min(3, elementStart.height * (1 - (deltaY / containerHeight) * 2)));
            break;
          case 'nw': // Northwest
            newScale.width = Math.max(0.1, Math.min(3, elementStart.width * (1 - (deltaX / containerWidth) * 2)));
            newScale.height = Math.max(0.1, Math.min(3, elementStart.height * (1 - (deltaY / containerHeight) * 2)));
            break;
        }

        if (type === 'clip') {
          updateClip(item.id, { scale: newScale });
        } else {
          updateTextOverlay(item.id, { scale: newScale });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';

      if (isDragging) {
        document.body.style.cursor = 'grabbing';
      } else if (isResizing) {
        const cursors = {
          'n': 'n-resize',
          'ne': 'ne-resize',
          'e': 'e-resize',
          'se': 'se-resize',
          's': 's-resize',
          'sw': 'sw-resize',
          'w': 'w-resize',
          'nw': 'nw-resize',
        };
        document.body.style.cursor = cursors[isResizing] || 'grab';
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isResizing, dragStart, elementStart, containerWidth, containerHeight, item.id, type, updateClip, updateTextOverlay, scale, position]);

  const resizeHandles = [
    { position: 'n', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1 cursor-n-resize' },
    { position: 'ne', className: 'top-0 right-0 -translate-y-1 translate-x-1 cursor-ne-resize' },
    { position: 'e', className: 'top-1/2 right-0 translate-x-1 -translate-y-1/2 cursor-e-resize' },
    { position: 'se', className: 'bottom-0 right-0 translate-x-1 translate-y-1 cursor-se-resize' },
    { position: 's', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1 cursor-s-resize' },
    { position: 'sw', className: 'bottom-0 left-0 -translate-x-1 translate-y-1 cursor-sw-resize' },
    { position: 'w', className: 'top-1/2 left-0 -translate-x-1 -translate-y-1/2 cursor-w-resize' },
    { position: 'nw', className: 'top-0 left-0 -translate-x-1 -translate-y-1 cursor-nw-resize' },
  ];

  return (
    <div
      ref={elementRef}
      className={cn(
        'absolute group',
        isSelected && 'z-10'
      )}
      style={{
        left: `${pixelPosition.x}px`,
        top: `${pixelPosition.y}px`,
        transform: `translate(-50%, -50%) scale(${scale.width}, ${scale.height}) rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onClick={handleClick}
    >
      {/* Main content */}
      <div
        className={cn(
          'relative cursor-grab hover:cursor-grab',
          isDragging && 'cursor-grabbing',
          isSelected && 'ring-2 ring-blue-400 ring-opacity-75'
        )}
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        {children}
      </div>

      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {resizeHandles.map((handle) => (
            <div
              key={handle.position}
              className={cn(
                'absolute w-3 h-3 bg-blue-400 border border-white rounded-full opacity-75 hover:opacity-100 hover:scale-110 transition-all',
                handle.className
              )}
              onMouseDown={(e) => handleMouseDown(e, handle.position)}
            />
          ))}

          {/* Selection outline */}
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed pointer-events-none opacity-50" />
        </>
      )}
    </div>
  );
};
