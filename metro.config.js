const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Web preview on Windows: skip NativeWind Metro plugin (Tailwind watch fails with spaced paths).
// CSS is pre-built via `node scripts/prebuild-css.mjs` before `npm run preview`.
const isWebPreview = process.env.EXPO_WEB_PREVIEW === '1';

if (isWebPreview) {
  module.exports = config;
} else {
  module.exports = withNativeWind(config, { input: './global.css' });
}
