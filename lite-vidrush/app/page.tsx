/**
 * Landing page - redirects to editor
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to editor page
    router.replace('/editor');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Lite VidRush</h1>
        <p className="text-gray-400">Loading video editor...</p>
      </div>
    </div>
  );
}