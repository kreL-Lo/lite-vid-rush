/**
 * Preview Component
 * Clean video preview using Remotion Player
 */

import React, { useEffect, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import { useEditorStore } from '@/lib/store';
import { RootComposition } from '@/remotion/RootComposition';
import { Button } from '@/components/ui/Button';
import { Volume2, VolumeX, Settings } from 'lucide-react';

export const Preview: React.FC = () => {
  const {
    playhead,
    frameRate,
    duration,
    isPlaying,
    media,
    texts,
    masterVolume,
    muted: masterMuted,
  } = useEditorStore();

  const playerRef = useRef<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Use master volume from store instead of local state
  const effectiveVolume = masterMuted ? 0 : masterVolume;

  // Sync playhead with Remotion Player (only when not playing to avoid conflicts)
  useEffect(() => {
    if (playerRef.current && !isPlaying) {
      playerRef.current.seekTo(playhead);
    }
  }, [playhead, isPlaying]);

  // Sync play/pause state and let Remotion handle its own timing when playing
  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        // Seek to current position before playing
        playerRef.current.seekTo(playhead);
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Listen to Remotion Player's frame updates when playing
  useEffect(() => {
    if (playerRef.current && isPlaying) {
      const player = playerRef.current;
      let intervalId: NodeJS.Timeout;

      // Use a slower interval to reduce conflicts (every 100ms instead of every frame)
      const updateFromPlayer = () => {
        if (player && isPlaying) {
          const currentFrame = player.getCurrentFrame();
          const currentState = useEditorStore.getState();

          if (currentFrame !== undefined &&
            currentState.isPlaying &&
            Math.abs(currentFrame - currentState.playhead) > 2) {
            // Only update store if there's a significant difference (>2 frames)
            useEditorStore.getState().setPlayhead(currentFrame);
          }

          // Check if we've reached the end
          if (currentFrame >= currentState.duration) {
            useEditorStore.getState().pause();
          }
        }
      };

      intervalId = setInterval(updateFromPlayer, 100); // Update every 100ms

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [isPlaying]);

  const editorState = {
    media,
    texts,
    selectedId: null,
    playhead,
    frameRate,
    duration,
    isPlaying,
    masterVolume,
    muted: masterMuted,
    zoom: 1,
    scrollPosition: 0,
  };

  // Get items visible at current frame for debug info
  const visibleMedia = media.filter(
    clip => playhead >= clip.startFrame && playhead < clip.endFrame
  );
  const visibleTexts = texts.filter(
    text => playhead >= text.startFrame && playhead < text.endFrame
  );

  // Debug logging
  console.log('Preview Debug:', {
    playhead,
    totalMedia: media.length,
    totalTexts: texts.length,
    visibleMedia: visibleMedia.length,
    visibleTexts: visibleTexts.length,
    mediaFrames: media.map(m => ({ id: m.id, start: m.startFrame, end: m.endFrame })),
  });

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    useEditorStore.getState().setMasterVolume(newVolume);
  };

  const toggleMute = () => {
    useEditorStore.getState().toggleMute();
  };
  console.log('here', media);
  return (
    <div className="flex-1 bg-gray-900 flex flex-col">
      {/* Preview Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-white font-medium">Preview</h3>
          <span className="text-xs text-gray-400">
            Frame {playhead} • {visibleMedia.length + visibleTexts.length} visible
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="px-2 py-1"
            >
              {masterMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={effectiveVolume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="px-2 py-1"
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-black flex items-center justify-center">
        <div className="relative w-full h-full max-w-5xl bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
          {/* Remotion Player */}

          <Player
            ref={playerRef}
            component={RootComposition}
            inputProps={{ editorState }}
            durationInFrames={duration}
            compositionWidth={1280}
            compositionHeight={720}
            fps={frameRate}
            controls={false}
            clickToPlay={false}
            loop={false}
            showVolumeControls={false}
            allowFullscreen={false}
            spaceKeyToPlayOrPause={false}
            doubleClickToFullscreen={false}
            initialFrame={playhead}

          />

          {/* Empty State */}
          {media.length === 0 && texts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gray-900/50">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">🎬</div>
                <div className="text-xl font-medium mb-2">No content to preview</div>
                <div className="text-sm">
                  Add video clips, images, or text overlays to see them here
                </div>
              </div>
            </div>
          )}

          {/* Debug overlay - show when content exists but nothing visible */}
          {(media.length > 0 || texts.length > 0) && visibleMedia.length === 0 && visibleTexts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-yellow-900/20">
              <div className="text-center text-yellow-400 bg-black/50 p-4 rounded">
                <div className="text-lg font-medium mb-2">Content exists but not visible</div>
                <div className="text-sm">
                  Total: {media.length} media, {texts.length} text<br />
                  Playhead: {playhead}<br />
                  Check timeline positioning or move playhead
                </div>
              </div>
            </div>
          )}

          {/* Playback Status Indicator */}
          {isPlaying && (
            <div className="absolute top-4 right-4 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-medium pointer-events-none flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              PLAYING
            </div>
          )}
        </div>
      </div>

      {/* Debug Info Panel */}
      {showDebugInfo && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <div className="text-gray-400 font-medium">Composition</div>
              <div className="text-white">1280×720 • {frameRate}fps</div>
              <div className="text-white">Duration: {(duration / frameRate).toFixed(1)}s</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400 font-medium">Playback</div>
              <div className="text-white">Frame: {playhead} / {duration}</div>
              <div className="text-white">Time: {(playhead / frameRate).toFixed(2)}s</div>
              <div className="text-white">Volume: {Math.round(effectiveVolume * 100)}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400 font-medium">Content</div>
              <div className="text-blue-400">Video: {media.filter(c => c.type !== 'audio').length}</div>
              <div className="text-green-400">Audio: {media.filter(c => c.type === 'audio').length}</div>
              <div className="text-purple-400">Text: {texts.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-400 font-medium">Visible</div>
              <div className="text-white">{visibleMedia.length} media</div>
              <div className="text-white">{visibleTexts.length} text</div>
              <div className="text-white">Preview Only</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};