// lib/ai/llm/tokenizer.ts

import type { ModelId, ModelSpec, Tokenizer } from './types';
import { MODEL_REGISTRY } from './config';
import { LLMError } from './types';

type GptTokenizerModule = {
  encode: (s: string) => number[] | Promise<number[]>;
  decode: (ids: number[]) => string | Promise<string>;
};

async function tryLoadGptBpe(): Promise<GptTokenizerModule | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mod = await import('gpt-tokenizer');
    if (mod?.encode && mod?.decode) return mod as GptTokenizerModule;
    return null;
  } catch {
    return null;
  }
}

/**
 * WHY: Provides only estimation when a real tokenizer isn't available.
 */
function makeLossyTokenizer(): Tokenizer {
  const vocab = new Map<string, number>();
  const inv = new Map<number, string>();
  let nextId = 100;

  function tokenToId(tok: string): number {
    if (!vocab.has(tok)) {
      const id = nextId++;
      vocab.set(tok, id);
      inv.set(id, tok);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return vocab.get(tok)!;
  }

  return {
    eosTokenId: 2,
    bosTokenId: 1,
    lossy: true,
    encode(text: string): number[] {
      return text
        .split(/(\s+)/)
        .filter(Boolean)
        .map(tokenToId)
        .concat([2]);
    },
    decode(ids: number[]): string {
      const toks = ids
        .filter((id) => id !== 1 && id !== 2)
        .map((id) => inv.get(id) ?? '');
      return toks.join('');
    },
  };
}

/**
 * Get a tokenizer for the given model id.
 */
export async function getTokenizerForModel(modelId: ModelId): Promise<Tokenizer> {
  const spec: ModelSpec | undefined = MODEL_REGISTRY[modelId];
  if (!spec) throw new LLMError('TOKENIZE_FAILED', `Unknown model: ${modelId}`);

  if (spec.tokenizer === 'gpt2-bpe') {
    const bpe = await tryLoadGptBpe();
    if (bpe) {
      return {
        eosTokenId: 50256,
        bosTokenId: 50256,
        lossy: false,
        encode: (s: string) => bpe.encode(s),
        decode: (ids: number[]) => bpe.decode(ids),
      };
    }
  }

  if (spec.tokenizer === 'llama-bpe') {
    // TODO: integrate a LLaMA-compatible tokenizer; fallback is estimation-only.
    return makeLossyTokenizer();
  }

  // default/custom → lossy fallback
  return makeLossyTokenizer();
}

/**
 * WHY: Prevent silent garbage ids in inference.
 */
export function assertTokenizerSafeForInference(tok: Tokenizer) {
  if (tok.lossy) {
    throw new LLMError(
      'TOKENIZE_FAILED',
      'A real tokenizer is required for inference. Install a compatible tokenizer (e.g., gpt-tokenizer) or provide a model-appropriate tokenizer.'
    );
  }
}

/**
 * Estimate token length; normalize sync/async encode to an array.
 */
export async function estimateTokenCount(modelId: ModelId, text: string): Promise<number> {
  const tok = await getTokenizerForModel(modelId);
  const maybeIds = tok.encode(text);
  const ids = Array.isArray(maybeIds) ? maybeIds : await maybeIds;
  return ids.length;
}