/**
 * Remotion configuration
 */

import { Config } from '@remotion/cli/config';
import path from 'path';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');

// Enable webpack alias for imports
Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...currentConfiguration.resolve?.alias,
        '@': path.resolve(process.cwd()),
      },
    },
  };
});

// Ignore certain files during bundling
// Config.setIgnoreUnsafeImports(true); // TODO: Check if this is still needed in newer versions

// Development settings
if (process.env.NODE_ENV === 'development') {
  Config.setPort(3001); // Avoid conflict with Next.js dev server
}

export default Config;
