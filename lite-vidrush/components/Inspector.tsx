/**
 * Inspector Component
 * Shows properties of the selected clip or text overlay
 */

import React, { useState } from 'react';
import { useEditorStore } from '@/lib/store';
import { Clip, TextOverlay } from '@/lib/types';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { cn } from '@/lib/utils';

export const Inspector: React.FC = () => {
  const { selectedId, getSelectedItem, updateClip, updateTextOverlay, removeItem } = useEditorStore();
  const selectedItem = getSelectedItem();

  if (!selectedItem || !selectedId) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Inspector</h3>
        <p className="text-gray-400 text-sm">Select a clip or text overlay to edit its properties.</p>
      </div>
    );
  }

  const isClip = 'src' in selectedItem;
  const isText = 'text' in selectedItem;

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">Inspector</h3>

      {/* Common properties */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Type
          </label>
          <div className="px-3 py-2 bg-gray-700 rounded text-sm text-gray-300">
            {isClip ? (selectedItem as Clip).type : 'text'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Frame
            </label>
            <input
              type="number"
              value={selectedItem.startFrame}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                if (isClip) {
                  updateClip(selectedId, { startFrame: newValue });
                } else {
                  updateTextOverlay(selectedId, { startFrame: newValue });
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Frame
            </label>
            <input
              type="number"
              value={selectedItem.endFrame}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                if (isClip) {
                  updateClip(selectedId, { endFrame: newValue });
                } else {
                  updateTextOverlay(selectedId, { endFrame: newValue });
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
            />
          </div>
        </div>

        {/* Clip-specific properties */}
        {isClip && <ClipInspector clip={selectedItem as Clip} clipId={selectedId} />}

        {/* Text-specific properties */}
        {isText && <TextInspector text={selectedItem as TextOverlay} textId={selectedId} />}

        {/* Delete button */}
        <div className="pt-4 border-t border-gray-700">
          <Button
            variant="destructive"
            onClick={() => removeItem(selectedId)}
            className="w-full"
          >
            Delete Item
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ClipInspectorProps {
  clip: Clip;
  clipId: string;
}

const ClipInspector: React.FC<ClipInspectorProps> = ({ clip, clipId }) => {
  const { updateClip } = useEditorStore();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Source
        </label>
        <div className="px-3 py-2 bg-gray-700 rounded text-sm text-gray-300 truncate">
          {clip.src}
        </div>
      </div>

      {/* TODO: Add trim controls */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Trim (TODO)
        </label>
        <div className="text-xs text-gray-500">
          Source trimming controls will be implemented here
        </div>
      </div>
    </div>
  );
};

interface TextInspectorProps {
  text: TextOverlay;
  textId: string;
}

const TextInspector: React.FC<TextInspectorProps> = ({ text, textId }) => {
  const { updateTextOverlay } = useEditorStore();
  const [localText, setLocalText] = useState(text.text);

  const handleTextChange = (newText: string) => {
    setLocalText(newText);
    updateTextOverlay(textId, { text: newText });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Text Content
        </label>
        <textarea
          value={localText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm resize-none"
          rows={3}
          placeholder="Enter text..."
        />
      </div>

      {/* Position controls */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Position
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">X Position (%)</label>
            <Slider
              value={[text.position.x]}
              onValueChange={([value]) =>
                updateTextOverlay(textId, {
                  position: { ...text.position, x: value }
                })
              }
              max={100}
              step={1}
              className="w-full"
            />
            <span className="text-xs text-gray-400">{text.position.x}%</span>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y Position (%)</label>
            <Slider
              value={[text.position.y]}
              onValueChange={([value]) =>
                updateTextOverlay(textId, {
                  position: { ...text.position, y: value }
                })
              }
              max={100}
              step={1}
              className="w-full"
            />
            <span className="text-xs text-gray-400">{text.position.y}%</span>
          </div>
        </div>
      </div>

      {/* Style controls */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Style
        </label>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Font Size</label>
          <Slider
            value={[text.style.fontSize]}
            onValueChange={([value]) =>
              updateTextOverlay(textId, {
                style: { ...text.style, fontSize: value }
              })
            }
            min={12}
            max={72}
            step={1}
            className="w-full"
          />
          <span className="text-xs text-gray-400">{text.style.fontSize}px</span>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Color</label>
          <input
            type="color"
            value={text.style.color}
            onChange={(e) =>
              updateTextOverlay(textId, {
                style: { ...text.style, color: e.target.value }
              })
            }
            className="w-full h-8 rounded border border-gray-600"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Background Color</label>
          <input
            type="color"
            value={text.style.backgroundColor || '#000000'}
            onChange={(e) =>
              updateTextOverlay(textId, {
                style: { ...text.style, backgroundColor: e.target.value }
              })
            }
            className="w-full h-8 rounded border border-gray-600"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Opacity</label>
          <Slider
            value={[text.style.opacity * 100]}
            onValueChange={([value]) =>
              updateTextOverlay(textId, {
                style: { ...text.style, opacity: value / 100 }
              })
            }
            max={100}
            step={1}
            className="w-full"
          />
          <span className="text-xs text-gray-400">{(text.style.opacity * 100).toFixed(0)}%</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Weight</label>
            <select
              value={text.style.fontWeight}
              onChange={(e) =>
                updateTextOverlay(textId, {
                  style: { ...text.style, fontWeight: e.target.value as 'normal' | 'bold' }
                })
              }
              className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Align</label>
            <select
              value={text.style.textAlign}
              onChange={(e) =>
                updateTextOverlay(textId, {
                  style: { ...text.style, textAlign: e.target.value as 'left' | 'center' | 'right' }
                })
              }
              className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// TODO: Add the following features:
// - Color picker with presets
// - Font family selection
// - Text shadow/outline controls
// - Animation presets for text
// - Keyframe editing for advanced animations
// - Clip volume controls for audio
// - Video effects and filters
// - Speed/duration controls
