/**
 * Remotion Root Composition
 * Renders video based on EditorState
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';
import { EditorState, Clip, TextOverlay } from '@/lib/types';

interface RootCompositionProps {
  editorState?: EditorState;
}

export const RootComposition: React.FC<RootCompositionProps> = ({ editorState }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ensure editorState exists and has required properties
  const safeEditorState = {
    media: [],
    texts: [],
    masterVolume: 1.0,
    muted: false,
    ...editorState,
  };


  // Get clips that should be visible at current frame
  const visibleClips = safeEditorState.media.filter(
    clip => frame >= clip.startFrame && frame < clip.endFrame
  );

  // Get text overlays that should be visible at current frame
  const visibleTexts = safeEditorState.texts.filter(
    text => frame >= text.startFrame && frame < text.endFrame
  );


  return (
    <AbsoluteFill style={{ backgroundColor: '#1f2937' }}>

      {/* Render media clips */}
      {visibleClips.map((clip) => (
        <ClipRenderer
          key={clip.id}
          clip={clip}
          currentFrame={frame}
          fps={fps}
          editorState={editorState}
        />
      ))}

      {/* Render text overlays */}
      {visibleTexts.map((text) => (
        <TextRenderer
          key={text.id}
          text={text}
          currentFrame={frame}
        />
      ))}

    </AbsoluteFill>
  );
};

interface ClipRendererProps {
  clip: Clip;
  currentFrame: number;
  fps: number;
  editorState: any; // Pass the entire editor state for volume controls
}

const ClipRenderer: React.FC<ClipRendererProps> = ({ clip, currentFrame, fps, editorState }) => {
  // Calculate the relative frame within this clip
  const clipFrame = currentFrame - clip.startFrame;
  const clipDuration = clip.endFrame - clip.startFrame;

  // Handle trim start/end for source media
  const sourceStartTime = (clip.trimStart || 0) / fps;
  const playbackRate = 1.0; // Keep normal playback speed

  const commonProps = {
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
    },
  };

  return (
    <Sequence
      from={clip.startFrame}
      durationInFrames={clipDuration}
      name={`clip-${clip.id}`}
    >
      {clip.type === 'video' && (
        <Video
          src={clip.src}
          volume={(clip.volume || 1.0) * (editorState.masterVolume || 1.0)}
          muted={clip.muted || editorState.muted || false}
          startFrom={Math.floor(sourceStartTime * fps)}
          playbackRate={playbackRate}
          {...commonProps}
        />
      )}

      {clip.type === 'audio' && (
        <Audio
          src={clip.src}
          volume={(clip.volume || 1.0) * (editorState.masterVolume || 1.0)}
          muted={clip.muted || editorState.muted || false}
          startFrom={Math.floor(sourceStartTime * fps)}
          playbackRate={playbackRate}
        />
      )}

      {clip.type === 'image' && (
        <Img
          src={clip.src}
          {...commonProps}
        />
      )}
    </Sequence>
  );
};

interface TextRendererProps {
  text: TextOverlay;
  currentFrame: number;
}

const TextRenderer: React.FC<TextRendererProps> = ({ text, currentFrame }) => {
  const textFrame = currentFrame - text.startFrame;
  const textDuration = text.endFrame - text.startFrame;

  // Simple fade in/out animation
  const opacity = interpolate(
    textFrame,
    [0, 10, textDuration - 10, textDuration],
    [0, text.style.opacity, text.style.opacity, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <Sequence
      from={text.startFrame}
      durationInFrames={textDuration}
      name={`text-${text.id}`}
    >
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            left: `${text.position.x}%`,
            top: `${text.position.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: text.style.fontSize,
            fontFamily: text.style.fontFamily,
            color: text.style.color,
            backgroundColor: text.style.backgroundColor,
            fontWeight: text.style.fontWeight,
            textAlign: text.style.textAlign,
            opacity,
            padding: text.style.backgroundColor ? '8px 12px' : 0,
            borderRadius: text.style.backgroundColor ? 4 : 0,
            whiteSpace: 'pre-wrap',
            maxWidth: '80%',
            wordWrap: 'break-word',
          }}
        >
          {text.text}
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

// Composition configuration
export const compositionConfig = {
  id: 'VideoEditor',
  component: RootComposition,
  durationInFrames: 900, // 30 seconds at 30fps (will be overridden)
  fps: 30,
  width: 1280,
  height: 720,
};

// TODO: Add support for:
// - Transitions between clips
// - Video effects and filters
// - Audio mixing and effects
// - Advanced text animations
// - Multiple video tracks/layers
// - Chroma key / green screen
// - Speed ramping
// - Audio waveform visualization
