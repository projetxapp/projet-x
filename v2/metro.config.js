const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

// Sentry's Expo config extends Expo's default Metro config (debug IDs for source maps).
const config = getSentryExpoConfig(__dirname);

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
