/**
 * Remotion Entry Point
 * Registers compositions for server-side rendering
 */

import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { RootComposition } from './RootComposition';

// Default editor state for fallback
const defaultEditorState = {
  media: [],
  texts: [],
  selectedId: null,
  playhead: 0,
  frameRate: 30,
  duration: 900,
  isPlaying: false,
  zoom: 1,
  scrollPosition: 0,
};

// Register the root component
registerRoot(() => {
  return (
    <Composition
      id="VideoEditor"
      component={RootComposition}
      durationInFrames={900} // This will be overridden by renderMedia()
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        editorState: defaultEditorState,
      }}
      // Calculate duration function that can be overridden
      calculateMetadata={({ props }) => {
        const editorState = props.editorState || defaultEditorState;
        return {
          durationInFrames: Math.max(editorState.duration || 900, 30), // At least 1 second
          fps: editorState.frameRate || 30,
        };
      }}
    />
  );
});
