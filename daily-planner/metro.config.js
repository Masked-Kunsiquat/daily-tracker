// metro.config.js - Updated for LLM integration
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add ONNX and other binary file extensions
config.resolver.assetExts.push(
  'onnx',    // ONNX model files
  'ort',     // ONNX Runtime files  
  'bin',     // Binary model files
  'safetensors', // Hugging Face model format
  'msgpack'  // Tokenizer files
);

// Add support for loading binary files
config.transformer.babelTransformerPath = require.resolve('./transformer.js');

// Increase Metro's memory limit for large model files
config.maxWorkers = 2;

// Configure resolver for better module resolution
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Add source extensions for TypeScript
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

module.exports = config;