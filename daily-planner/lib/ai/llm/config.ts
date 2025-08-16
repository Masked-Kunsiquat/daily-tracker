// daily-planner/lib/ai/llm/config.ts
import type { DeviceProfile, GenerationParams, ModelId, ModelSpec } from './types';

export const MODEL_DIR = 'models'; // why: keeps all weights under a single app directory
export const CACHE_DIR = 'cache';

export const DEFAULT_MODEL_ID: ModelId = 'base-sum-onnx';

export const GENERATION_DEFAULTS: GenerationParams = {
  maxNewTokens: 256,
  temperature: 0.2,
  top_p: 0.95,
  top_k: 50,
  stopSequences: ['</s>', '<|eot|>'],
};

export const JSON_INSTRUCTIONS = `You are to output ONLY valid JSON that matches the provided schema. Do not add commentary or code fences. Invalid JSON is not accepted.`;

/* Replace URLs + hashes with your artifacts. Use https with range support for resumable downloads. */
export const MODEL_REGISTRY: Record<ModelId, ModelSpec> = {
  /* --- Phase 3.0: new placeholders (no behavior change; URLs/hashes REQUIRED) --- */
  'distilbart-cnn-6-6-q8': {
    id: 'distilbart-cnn-6-6-q8',
    displayName: 'DistilBART-CNN 6-6 (INT8)',
    sourceURL: 'REQUIRED',         // REQUIRED: CDN https URL to .onnx (supports range)
    sha256: 'REQUIRED',            // REQUIRED: SHA-256 of the ONNX file
    sizeMB: 150,
    maxInputTokens: 1024,
    maxOutputTokens: 256,
    quantization: 'int8',
    tokenizer: 'roberta-bpe',      // DistilBART/BART family uses Roberta/BPE
  },
  't5-small-q8': {
    id: 't5-small-q8',
    displayName: 'T5-small (INT8)',
    sourceURL: 'REQUIRED',         // REQUIRED: CDN https URL to .onnx (supports range)
    sha256: 'REQUIRED',            // REQUIRED: SHA-256 of the ONNX file
    sizeMB: 120,
    maxInputTokens: 512,
    maxOutputTokens: 256,
    quantization: 'int8',
    tokenizer: 't5-spm',           // T5 uses SentencePiece
  },

  'tiny-sum-onnx': {
    id: 'tiny-sum-onnx',
    displayName: 'Tiny Summarizer (ONNX int8)',
    sourceURL:
      'https://example.com/models/tiny-sum-onnx/tiny-sum-quant-int8.onnx', // TODO
    sha256: '', // empty skips verification until you add real hash
    sizeMB: 35,
    maxInputTokens: 2048,
    maxOutputTokens: 256,
    quantization: 'int8',
    tokenizer: 'gpt2-bpe',
  },
  'base-sum-onnx': {
    id: 'base-sum-onnx',
    displayName: 'Base Summarizer (ONNX int8)',
    sourceURL:
      'https://example.com/models/base-sum-onnx/base-sum-quant-int8.onnx', // TODO
    sha256: '',
    sizeMB: 120,
    maxInputTokens: 3072,
    maxOutputTokens: 512,
    quantization: 'int8',
    tokenizer: 'gpt2-bpe',
  },
  'pro-sum-onnx': {
    id: 'pro-sum-onnx',
    displayName: 'Pro Summarizer (ONNX fp16)',
    sourceURL:
      'https://example.com/models/pro-sum-onnx/pro-sum-fp16.onnx', // TODO
    sha256: '',
    sizeMB: 380,
    maxInputTokens: 4096,
    maxOutputTokens: 768,
    quantization: 'fp16',
    tokenizer: 'llama-bpe',
  },
};

/* Simple selection policy based on RAM and accelerators. */
export function selectModelForDevice(d: DeviceProfile): ModelId {
  if (d.ramGB >= 8) return 'pro-sum-onnx';
  if (d.ramGB >= 4) return 'base-sum-onnx';
  return 'tiny-sum-onnx';
}

/* Execution provider priorities for onnxruntime-react-native. */
export function selectOrtExecutionProviders(d: DeviceProfile): string[] {
  const providers: string[] = [];
  if (d.os === 'ios' && d.hasCoreML) providers.push('coreml');
  if (d.os === 'android' && d.hasNNAPI) providers.push('nnapi');
  if (d.os === 'windows' && d.hasDirectML) providers.push('dml');
  providers.push('cpu'); // always keep cpu as fallback
  return providers;
}

/* Lightweight warmup prompt to populate kernels/caches. */
export const ORT_WARMUP_PROMPT =
  'Summarize: Warming up the model with a short benign sentence.';
