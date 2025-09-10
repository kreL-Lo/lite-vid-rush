/**
 * Media Browser Component
 * Shows uploaded files and allows adding them to timeline
 */

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { Button } from './ui/Button';
import { formatFileSize } from '@/lib/utils';
import {
  Video,
  Music,
  Image as ImageIcon,
  Trash2,
  Plus,
  RefreshCw,
  Folder
} from 'lucide-react';

interface MediaFile {
  filename: string;
  url: string;
  size: number;
  sizeFormatted: string;
  mediaType: 'video' | 'audio' | 'image' | 'unknown';
  uploadedAt: string;
}

interface MediaBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaBrowser: React.FC<MediaBrowserProps> = ({ isOpen, onClose }) => {
  const { addClip } = useEditorStore();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load media files
  const loadMediaFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/media');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMediaFiles(result.files);
        } else {
          setError('Failed to load media files');
        }
      } else {
        setError('Failed to load media files');
      }
    } catch (error) {
      setError('Error loading media files');
      console.error('Media load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load files when component opens
  useEffect(() => {
    if (isOpen) {
      loadMediaFiles();
    }
  }, [isOpen]);

  // Delete media file
  const deleteMediaFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/media?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from list
        setMediaFiles(prev => prev.filter(file => file.filename !== filename));
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting file');
    }
  };

  // Add file to timeline
  const addToTimeline = (file: MediaFile) => {
    // Calculate duration based on file type
    let durationFrames = 300; // 10 seconds default
    if (file.mediaType === 'image') {
      durationFrames = 150; // 5 seconds for images
    }

    addClip({
      src: `http://localhost:3000${file.url}`, // Convert to full URL
      startFrame: 0,
      endFrame: durationFrames,
      type: file.mediaType as 'video' | 'audio' | 'image',
    });
  };

  // Get icon for media type
  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video': return <Video size={16} className="text-blue-400" />;
      case 'audio': return <Music size={16} className="text-green-400" />;
      case 'image': return <ImageIcon size={16} className="text-orange-400" />;
      default: return <Folder size={16} className="text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Media Browser</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMediaFiles}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">Loading media files...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={loadMediaFiles} className="mt-2">
                Retry
              </Button>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Folder size={48} className="mx-auto mb-4 opacity-50" />
              <p>No media files uploaded yet.</p>
              <p className="text-sm mt-2">Upload some files to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaFiles.map((file) => (
                <div
                  key={file.filename}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                >
                  {/* File preview */}
                  <div className="aspect-video bg-gray-800 rounded mb-3 flex items-center justify-center">
                    {file.mediaType === 'image' ? (
                      <img
                        src={`http://localhost:3000${file.url}`}
                        alt={file.filename}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        {getMediaIcon(file.mediaType)}
                        <div className="text-xs text-gray-400 mt-1">
                          {file.mediaType.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getMediaIcon(file.mediaType)}
                      <span className="text-sm font-medium text-white truncate">
                        {file.filename}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      {file.sizeFormatted}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToTimeline(file)}
                        className="flex-1"
                      >
                        <Plus size={14} className="mr-1" />
                        Add to Timeline
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMediaFile(file.filename)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center text-sm text-gray-400">
          {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} •
          Total: {formatFileSize(mediaFiles.reduce((sum, file) => sum + file.size, 0))}
        </div>
      </div>
    </div>
  );
};

// TODO: Add the following features:
// - File search/filter functionality
// - Bulk operations (select multiple files)
// - File preview with play button for videos
// - Folder organization
// - File metadata display (duration, dimensions, etc.)
// - Thumbnail generation
// - Drag and drop from media browser to timeline
