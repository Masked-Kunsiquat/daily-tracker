const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add ONNX to asset extensions
config.resolver.assetExts.push('onnx', 'ort', 'bin');

// Add support for loading binary files
config.transformer.babelTransformerPath = require.resolve('./transformer.js');

module.exports = config;