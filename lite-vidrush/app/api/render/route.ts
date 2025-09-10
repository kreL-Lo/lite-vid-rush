/**
 * Render API Route
 * Handles video rendering using Remotion
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RenderSettings, DEFAULT_RENDER_SETTINGS } from '@/lib/types';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Validation schema for render request
const RenderRequestSchema = z.object({
  editorState: z.object({
    media: z.array(z.any()),
    texts: z.array(z.any()),
    selectedId: z.string().nullable(),
    playhead: z.number(),
    frameRate: z.number(),
    duration: z.number(),
    isPlaying: z.boolean(),
    zoom: z.number(),
    scrollPosition: z.number(),
  }),
  settings: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    fps: z.number().optional(),
    codec: z.enum(['h264', 'h265']).optional(),
    bitrate: z.string().optional(),
    outputFormat: z.enum(['mp4', 'webm']).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = RenderRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { editorState, settings = {} } = validation.data;

    // Merge with default settings
    const renderSettings: RenderSettings = {
      ...DEFAULT_RENDER_SETTINGS,
      ...settings,
    };

    // Validate that we have content to render
    if (editorState.media.length === 0 && editorState.texts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No content to render' },
        { status: 400 }
      );
    }

    // Check for blob URLs which won't work in server-side rendering
    const hasBlobUrls = editorState.media.some(clip => clip.src.startsWith('blob:'));

    console.log('hasBlobUrls',editorState.media);
    if (hasBlobUrls) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot render media with blob URLs', 
          message: 'Media files need to be uploaded to the server before rendering. Currently using client-side blob URLs which are not accessible during server-side rendering.',
          details: 'Please implement proper file upload to server storage (local files or cloud storage) to enable video rendering.'
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      console.log('🎬 Starting server-side video rendering...');
      
      // Create temporary directory for output
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vidrush-render-'));
      const outputPath = path.join(tempDir, `render-${Date.now()}.mp4`);
      
      console.log(`📁 Temp directory: ${tempDir}`);
      console.log(`📹 Output path: ${outputPath}`);

      // Dynamically import Remotion packages (server-only)
      const { bundle } = await import('@remotion/bundler');
      const { renderMedia, getCompositions } = await import('@remotion/renderer');

      console.log('📦 Starting Remotion bundle process...');
      
      // Use a simpler bundling approach
      const entryPoint = path.resolve(process.cwd(), 'remotion/index.tsx');
      console.log(`Entry point: ${entryPoint}`);
      
      // Check if entry point exists
      try {
        await fs.access(entryPoint);
        console.log('✅ Entry point file exists');
      } catch (error) {
        throw new Error(`Entry point file not found: ${entryPoint}`);
      }
      
      const bundleLocation = await bundle({
        entryPoint,
        webpackOverride: (config) => {
          // Minimal webpack override to avoid conflicts
          return {
            ...config,
            resolve: {
              ...config.resolve,
              alias: {
                ...config.resolve?.alias,
                '@': path.resolve(process.cwd()),
              },
              extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
            },
            externals: {
              // Don't bundle Next.js specific modules
              'next': 'commonjs next',
              'next/server': 'commonjs next/server',
            },
          };
        },
        onProgress: (progress) => {
          console.log(`📦 Bundle progress: ${Math.round(progress * 100)}%`);
        },
      });

      console.log(`✅ Bundle created at: ${bundleLocation}`);

      // Get available compositions
      console.log('🔍 Getting compositions...');
      const compositions = await getCompositions(bundleLocation, {
        inputProps: {
          editorState,
        },
      });
      
      console.log('📋 Available compositions:', compositions.map(c => c.id));
      
      // Find the VideoEditor composition
      const composition = compositions.find(c => c.id === 'VideoEditor');
      if (!composition) {
        throw new Error(`Composition "VideoEditor" not found. Available: ${compositions.map(c => c.id).join(', ')}`);
      }
      
      console.log('✅ Found composition:', composition.id);

      // Render the video with proper configuration
      console.log('🎥 Starting video render...');
      console.log('here',editorState);
      const renderStart = Date.now();
        await renderMedia({
          composition,
          serveUrl: bundleLocation,
          codec: 'h264',
          outputLocation: outputPath, 
          inputProps: {
            editorState,
          },
      
        onProgress: ({ renderedFrames, encodedFrames }) => {
          
        },
        onDownload: (src) => {
          console.log(`📥 Downloaded: ${src}`);
        },
        overwrite: true,
        imageFormat: 'jpeg',
        jpegQuality: 90,
      });

      const renderEnd = Date.now();
      console.log(`✅ Video rendered successfully in ${renderEnd - renderStart}ms!`);

      // Read the rendered video file
      const videoBuffer = await fs.readFile(outputPath);
      console.log(`📄 Video file size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      // Clean up temporary files
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('🧹 Cleaned up temporary files');

      const renderTime = Date.now() - startTime;

      // Return the video as a downloadable response
      return new NextResponse(videoBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="vidrush-export-${Date.now()}.mp4"`,
          'Content-Length': videoBuffer.length.toString(),
          'X-Render-Time': renderTime.toString(),
        },
      });

    } catch (renderError) {
      console.error('❌ Render failed:', renderError);
      
      return NextResponse.json({
        success: false,
        error: 'Video rendering failed',
        details: renderError instanceof Error ? renderError.message : 'Unknown render error',
        renderTime: Date.now() - startTime,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Render error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Render failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// TODO: Implement the following features:
// - Progress tracking for long renders
// - Queue system for multiple render requests
// - Cloud storage integration (AWS S3, etc.)
// - Render presets (quality settings)
// - Watermarking
// - Batch rendering
// - Render cancellation
// - Resource cleanup (delete temporary files)
// - Rate limiting
// - Authentication/authorization
