/**
 * Video Editor Page
 * Main editor interface with timeline, preview, and controls
 */

'use client';

import React, { useState, useRef } from 'react';
import { Timeline } from '@/components/Timeline';
import { Preview } from '@/components/Preview';
import { SimplePreview } from '@/components/SimplePreview';
import { Inspector } from '@/components/Inspector';
import { PlayControls } from '@/components/PlayControls';
import { MediaBrowser } from '@/components/MediaBrowser';
import { Button } from '@/components/ui/Button';
import { useEditorStore } from '@/lib/store';
import {
  Upload,
  Download,
  Save,
  FileText,
  Settings,
  Menu,
  FolderOpen
} from 'lucide-react';

export default function EditorPage() {
  const { addClip, addTextOverlay } = useEditorStore();
  const [isRendering, setIsRendering] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragActive, setDragActive] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    await uploadFiles(Array.from(files));
    event.target.value = '';
  };

  // Upload files function (uses server-side upload)
  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    const uploadedClips = [];

    // Get existing media to check for duplicates
    const existingMedia = useEditorStore.getState().media;

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));

      try {
        console.log(`📤 Uploading ${file.name} to server...`);

        // Check if file already exists in timeline
        const existingFile = existingMedia.find(clip =>
          clip.originalName === file.name && clip.size === file.size
        );

        if (existingFile && !existingFile.src.startsWith('blob:')) {
          console.log(`⚠️ File ${file.name} already exists in timeline, skipping upload`);
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

          // Still add to timeline if user wants it
          const startFrame = uploadedClips.length * 30;
          uploadedClips.push({
            ...existingFile,
            startFrame,
            endFrame: startFrame + (existingFile.endFrame - existingFile.startFrame),
          });
          continue;
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 20 }));

        // Create FormData for server upload
        const formData = new FormData();
        formData.append('file', file);

        setUploadProgress(prev => ({ ...prev, [fileId]: 30 }));

        // Upload to server with progress tracking
        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(prev => ({ ...prev, [fileId]: 80 }));

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const uploadResult = await response.json();
        console.log('📤 Upload result:', uploadResult);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed - no success flag');
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        // Validate server response
        if (!uploadResult.url) {
          throw new Error('Server did not return file URL');
        }

        // Use server URL instead of blob URL
        const serverUrl = `http://localhost:3000${uploadResult.url}`; // Convert to full URL
        console.log(`📁 Server URL: ${serverUrl}`);

        // Determine media type
        const type = uploadResult.mediaType || (
          file.type.startsWith('video/') ? 'video' :
            file.type.startsWith('audio/') ? 'audio' : 'image'
        );

        // Calculate duration based on file type
        let durationFrames = 300; // 10 seconds default
        if (type === 'image') {
          durationFrames = 150; // 5 seconds for images
        }
        // TODO: Extract actual duration from video/audio metadata

        const clipData = {
          src: serverUrl, // IMPORTANT: Use server URL instead of blob URL
          startFrame: 0,
          endFrame: durationFrames,
          type: type as 'video' | 'audio' | 'image',
          filename: uploadResult.filename,
          originalName: uploadResult.originalName || file.name,
          size: uploadResult.size || file.size,
        };

        uploadedClips.push(clipData);
        console.log(`✅ Uploaded ${file.name} to server: ${serverUrl}`);

      } catch (error) {
        console.error('❌ Upload error:', error);
        alert(`Error uploading ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      }

      // Remove progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }, 2000);
    }

    // Add all successfully uploaded clips to timeline
    uploadedClips.forEach((clipData, index) => {
      // Stagger clips so they don't overlap
      const startFrame = index * 30; // 1 second apart at 30fps
      addClip({
        ...clipData,
        startFrame,
        endFrame: startFrame + (clipData.endFrame - clipData.startFrame),
      });
    });

    console.log(`🎬 Added ${uploadedClips.length} clips to timeline`);
    setIsUploading(false);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  // Add text overlay
  const handleAddText = () => {
    addTextOverlay({
      text: 'New Text',
      startFrame: 0,
      endFrame: 150, // 5 seconds at 30fps
      position: { x: 50, y: 50 },
      style: {
        fontSize: 32,
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        opacity: 1,
        fontWeight: 'normal',
        textAlign: 'center',
      },
    });
  };

  // Handle render
  const handleRender = async () => {
    const editorState = useEditorStore.getState();

    // Check if there's content to render
    if (editorState.media.length === 0 && editorState.texts.length === 0) {
      alert('Please add some content to render first!');
      return;
    }

    setIsRendering(true);

    try {
      console.log('🎬 Starting server-side video render...');

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editorState,
          settings: {
            width: 1280,
            height: 720,
            fps: 30,
            codec: 'h264',
            outputFormat: 'mp4',
          },
        }),
      });

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        // JSON response (could be error or status)
        const result = await response.json();

        if (response.ok) {
          // Success JSON response
          console.log('✅ Render request processed:', result);
          alert(`✅ ${result.message || 'Render completed successfully!'}`);
        } else if (response.status === 503) {
          // Service temporarily unavailable
          console.log('⚠️ Render service temporarily unavailable:', result);
          alert(`⚠️ ${result.message}\n\nDetails: ${result.details}`);
        } else {
          // Error response
          throw new Error(result.error || result.message || 'Render failed');
        }
      } else {
        // Binary response (video file)
        if (response.ok) {
          const videoBlob = await response.blob();
          const renderTime = response.headers.get('X-Render-Time');

          console.log(`✅ Video rendered successfully in ${renderTime}ms`);

          // Create download link
          const url = URL.createObjectURL(videoBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `vidrush-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          alert('🎉 Video exported successfully! Check your downloads folder.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('❌ Render error:', error);
      alert(`Rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Top toolbar */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Lite VidRush</h1>

          <div className="flex items-center space-x-2">
            {/* File upload */}
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} className="mr-2" />
              {isUploading ? 'Uploading...' : 'Import Media'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/mp4,video/mov,video/avi,video/mkv,video/webm,audio/mp3,audio/wav,audio/aac,audio/m4a,audio/ogg,image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />

            {/* Media Browser */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMediaBrowser(true)}
            >
              <FolderOpen size={16} className="mr-2" />
              Media Browser
            </Button>

            {/* Add text */}
            <Button variant="outline" size="sm" onClick={handleAddText}>
              <FileText size={16} className="mr-2" />
              Add Text
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">


          {/* Render button */}
          <Button
            onClick={handleRender}
            disabled={isRendering}
            size="sm"
          >
            <Download size={16} className="mr-2" />
            {isRendering ? 'Rendering...' : 'Export'}
          </Button>

          {/* Toggle inspector */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInspector(!showInspector)}
          >
            <Menu size={16} />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div
        className="flex-1 flex relative"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Left panel - Preview and Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Preview area */}
          <div className="flex-1 relative">
            <Preview />

            {/* Drag overlay */}
            {dragActive && (
              <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-400 flex items-center justify-center z-50">
                <div className="text-center text-blue-100">
                  <Upload size={48} className="mx-auto mb-4" />
                  <div className="text-xl font-semibold mb-2">Drop files here</div>
                  <div className="text-sm">Support: MP4, MOV, PNG, JPG, MP3, WAV</div>
                </div>
              </div>
            )}
          </div>

          {/* Play controls */}
          <PlayControls />

          {/* Timeline */}
          <div className="h-64 border-t border-gray-700">
            <Timeline />
          </div>
        </div>

        {/* Right panel - Inspector */}
        {showInspector && <Inspector />}
      </div>

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 min-w-80">
            <h3 className="text-lg font-medium mb-4 text-center">Uploading Files</h3>
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([fileId, progress]) => {
                const fileName = fileId.split('-')[0];
                return (
                  <div key={fileId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300 truncate">{fileName}</span>
                      <span className="text-gray-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Render progress overlay */}
      {isRendering && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 text-center min-w-80">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            </div>
            <h3 className="text-lg font-medium mb-2">Rendering Video</h3>
            <p className="text-gray-400 mb-4">
              Server is processing your video...
            </p>
            <p className="text-sm text-gray-500">
              This may take a few moments depending on video length and complexity.
            </p>
          </div>
        </div>
      )}

      {/* Media Browser */}
      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
      />


      {/* Keyboard shortcuts help - TODO: Implement */}
      {false && (
        <div className="absolute bottom-4 left-4 bg-black/80 rounded px-3 py-2 text-sm text-gray-400">
          <div>Space: Play/Pause • ←→: Frame step • Del: Delete selected</div>
        </div>
      )}
    </div>
  );
}

// TODO: Implement the following features:
// - Keyboard shortcuts
// - Project save/load functionality
// - Undo/redo system
// - Multiple project tabs
// - Template system
// - Asset library/media browser
// - Collaboration features
// - Auto-save
// - Export presets
// - Batch processing
