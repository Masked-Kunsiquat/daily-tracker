// daily-planner/lib/ai/llm/types.ts
export type SummaryType = 'weekly' | 'monthly' | 'yearly';

export type ModelId =
  | 'tiny-sum-onnx'
  | 'base-sum-onnx'
  | 'pro-sum-onnx'
  | 'distilbart-cnn-6-6-q8'
  | 't5-small-q8';

  export interface ModelSpec {
  id: ModelId;
  displayName: string;
  sourceURL: string;
  sha256?: string; // If omitted/empty, verification is skipped.
  sizeMB: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  quantization?: 'int4' | 'int8' | 'fp16' | 'fp32';
  tokenizer?: 'gpt2-bpe' | 'llama-bpe' | 'roberta-bpe' | 't5-spm' | 'custom';
  }

export interface DeviceProfile {
  os: 'ios' | 'android' | 'windows' | 'macos' | 'web';
  arch?: string;
  ramGB: number;
  cores?: number;
  hasNEON?: boolean;
  hasNNAPI?: boolean;
  hasCoreML?: boolean;
  hasDirectML?: boolean;
}

export interface DownloadProgress {
  totalBytes: number;
  receivedBytes: number;
  pct: number;
  state: 'starting' | 'downloading' | 'verifying' | 'done';
}

export interface GenerationParams {
  maxNewTokens: number;
  temperature: number;
  top_p: number;
  top_k: number;
  stopSequences: string[];
}

export interface Tokenizer {
  encode(text: string): Promise<number[]> | number[];
  decode(ids: number[]): Promise<string> | string;
  eosTokenId: number;
  bosTokenId?: number;
  lossy?: boolean; // why: signals approximate tokenization, safe for length estimation only
}

export interface SummaryJSON {
  type: SummaryType;
  period: { start: string; end: string };
  highlights: string[];
  themes?: string[];
  metrics?: Record<string, number | string>;
  action_items?: string[];
  risks?: string[];
  notes?: string;
}

export type LLMErrorCode =
  | 'DOWNLOAD_FAILED'
  | 'VERIFY_FAILED'
  | 'INFERENCE_FAILED'
  | 'TOKENIZE_FAILED'
  | 'PARSE_FAILED'
  | 'SCHEMA_MISMATCH';

export class LLMError extends Error {
  code: LLMErrorCode;
  constructor(code: LLMErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'LLMError';
  }
}

export interface InferenceInitOptions {
  modelId?: ModelId;
  warmup?: boolean;
}

export interface JsonInstruction {
  purpose: string;
  schemaHint: string;
}