/**
 * PlayControls Component
 * Playback controls and scrubber for the video editor
 */

import React from 'react';
import { useEditorStore } from '@/lib/store';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { framesToTime } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export const PlayControls: React.FC = () => {
  const {
    playhead,
    duration,
    frameRate,
    isPlaying,
    zoom,
    play,
    pause,
    stop,
    setPlayhead,
    setZoom,
  } = useEditorStore();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleSkipBack = () => {
    setPlayhead(Math.max(0, playhead - frameRate)); // Skip back 1 second
  };

  const handleSkipForward = () => {
    setPlayhead(Math.min(duration, playhead + frameRate)); // Skip forward 1 second
  };

  const handleScrub = (value: number[]) => {
    setPlayhead(value[0]);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.5, 0.1));
  };

  return (
    <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center px-4 space-x-4">
      {/* Transport controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipBack}
          className="text-white hover:text-blue-400"
        >
          <SkipBack size={16} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayPause}
          className="text-white hover:text-blue-400"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="text-white hover:text-blue-400"
        >
          <Square size={16} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipForward}
          className="text-white hover:text-blue-400"
        >
          <SkipForward size={16} />
        </Button>
      </div>

      {/* Time display */}
      <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
        <span>{framesToTime(playhead, frameRate)}</span>
        <span className="text-gray-500">/</span>
        <span>{framesToTime(duration, frameRate)}</span>
      </div>






      {/* Frame rate indicator */}
      <div className="text-sm text-gray-400">
        {frameRate}fps
      </div>
    </div>
  );
};

// TODO: Implement the following features:
// - Keyboard shortcuts (spacebar for play/pause, arrow keys for frame stepping)
// - Loop playback mode
// - Playback speed controls (0.25x, 0.5x, 1x, 2x, etc.)
// - Audio waveform in scrubber
// - Frame-accurate stepping (left/right arrow keys)
// - Jump to start/end buttons
// - Time input field for precise positioning
// - Fullscreen preview mode
