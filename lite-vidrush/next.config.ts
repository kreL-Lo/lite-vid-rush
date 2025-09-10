import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    'esbuild',
    'ffmpeg-static',
    'ffprobe-static',
  ],
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,  
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };

      // Exclude server-only packages
      config.externals = [
        ...(config.externals || []),
        '@remotion/bundler',
        '@remotion/renderer',
        'esbuild',
        'ffmpeg-static',
        'ffprobe-static',
      ];
    }

    return config;
  },
};

export default nextConfig;
