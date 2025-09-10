/**
 * Media Upload API Route
 * Handles file uploads using formidable
 */

import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { getMediaType, formatFileSize, generateTimestampedFilename } from '@/lib/utils';

// Configure upload limits
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm',
  'audio/mp3', 'audio/wav', 'audio/aac', 'audio/m4a', 'audio/ogg',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp'
];

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Media upload API called');
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    console.log(`📁 Upload directory: ${uploadDir}`);

    // Parse the form data using Next.js built-in FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json( 
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`📤 Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 100MB.' },
        { status: 413 }
      );
    }

    // Generate new filename with timestamp
    const originalName = file.name;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const newFilename = generateTimestampedFilename(baseName, extension.slice(1));
    const newPath = path.join(uploadDir, newFilename);

    // Save file to disk
    const buffer = await file.arrayBuffer();
    await fs.writeFile(newPath, Buffer.from(buffer));
    console.log(`📁 File saved to: ${newPath}`);

    // Get file metadata
    const stats = await fs.stat(newPath);
    const mediaType = getMediaType(originalName);
    console.log(`📊 File stats: ${stats.size} bytes, type: ${mediaType}`);

    // TODO: Extract media metadata (duration, dimensions, etc.)
    const metadata = {
      size: stats.size,
      // For video/audio files, you would use ffprobe here to get duration, dimensions, etc.
      // duration: await getMediaDuration(newPath),
      // width: await getVideoWidth(newPath),
      // height: await getVideoHeight(newPath),
    };

    const result = {
      success: true,
      url: `/uploads/${newFilename}`,
      filename: newFilename,
      originalName,
      mediaType,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      metadata,
    };

    console.log(`✅ Upload successful: ${result.url}`);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Upload error:', error);

    if (error instanceof Error) {
      if (error.message.includes('maxFileSize')) {
        return NextResponse.json(
          { success: false, error: 'File too large. Maximum size is 100MB.' },
          { status: 413 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list uploaded files
export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });
    
    const files = await fs.readdir(uploadDir);
    const fileList = [];

    for (const filename of files) {
      const filePath = path.join(uploadDir, filename);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        fileList.push({
          filename,
          url: `/uploads/${filename}`,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          mediaType: getMediaType(filename),
          uploadedAt: stats.mtime,
        });
      }
    }

    return NextResponse.json({
      success: true,
      files: fileList.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()),
    });

  } catch (error) {
    console.error('File list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    // Security check: ensure the file is within the uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }

    await fs.unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

// TODO: Implement the following features:
// - File compression/optimization
// - Thumbnail generation for videos/images
// - Virus scanning
// - Cloud storage integration (AWS S3, etc.)
// - CDN integration
// - File metadata extraction (ffprobe for video/audio)
// - Image resizing/format conversion
// - Progress tracking for large uploads
// - Resume interrupted uploads
// - File deduplication
