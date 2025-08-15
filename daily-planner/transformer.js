// transformer.js - Custom Metro transformer for binary files
const { getDefaultConfig } = require('expo/metro-config');
const upstreamTransformer = require('@expo/metro-config/build/transformer');

const binaryExtensions = ['onnx', 'ort', 'bin'];

module.exports.transform = function ({ src, filename, options }) {
  // Check if this is a binary file we need to handle
  const extension = filename.split('.').pop();
  
  if (binaryExtensions.includes(extension)) {
    // For binary files, we'll return a module that exports the file path
    // This allows the ONNX runtime to load the file directly
    const baseName = filename.split('/').pop();
    
    return upstreamTransformer.transform({
      src: `
        const { Platform } = require('react-native');
        const path = Platform.select({
          ios: '${filename}',
          android: 'file:///android_asset/${baseName}',
          default: '${filename}'
        });
        module.exports = path;
      `,
      filename,
      options,
    });
  }
  
  // For all other files, use the default transformer
  return upstreamTransformer.transform({ src, filename, options });
};